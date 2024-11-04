# Configuration and State Management

## General Structure

- State is segmented by branch name, meaning each Git branch maintains its own state. This can be stored as a file or a database row. State is just collection of resources.

- Each resource is associated with a `branch`, either implicitly or explicitly. If a branch is not specified, it defaults to the main branch. If a branch pattern is used, it defaults to the current branch.

- Resources can also specify a `branchPattern`, which matches multiple branches. When a branch matches the pattern, a new resource is created for that branch.

- When executing changes, the current branch is locked for writing. Dependencies on other branches will cause those branches to be locked as well.

### Example Configuration

Given a configuration like this:

```json
{
  "cloudflare": {
    "r2": {
      "bucket1": { "branch": "master" },
      "bucket2": { "storageClass": "Standard" },
      "bucket3": { "branch": "develop" }
    }
  }
}
```

The resulting state, when executed fully on both branches, would look like this:

**`master.state.json`**

```json
{
  "cloudflare": {
    "r2": {
      "bucket1": {
        "branch": "master",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "config": { "branch": "master" }
      },
      "bucket2": {
        "branch": "master",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "config": { "branch": "master" }
      }
    }
  }
}
```

**`develop.state.json`**

```json
{
  "cloudflare": {
    "r2": {
      "bucket3": {
        "branch": "develop",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "config": { "branch": "develop" }
      }
    }
  }
}
```

States are partitioned by branch to avoid conflicts and race conditions. While calculating a plan, only the config and state for the current branch are considered, ensuring the process is straightforward and predictable.

### Planning Example

For the `master` branch, the plan calculation might be represented as follows:

```typescript
plan(currentBranchState, currentBranchConfig): Plan
```

```typescript
plan(
  {
    "cloudflare": {
      "r2": {
        "bucket1": { "branch": "master" }
      }
    }
  },
  {
    "cloudflare": {
      "r2": {
        "bucket1": {
          "branch": "master",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "config": { "branch": "master" }
        }
      }
    }
  }
)
```

The plan results in changes to the state, such as Create, Update, Delete, or Noop.

## Branch Patterns

Resources can be created for each `feature/*` branch using the git template. If a branch pattern is used, it automatically matches the current branch.

### Example with Branch Patterns

```json
{
  "cloudflare": {
    "r2": {
      "bucket1": { "branch": "master" },
      "bucket2": { "branch": "develop" },
      "branch-{{git.BRANCH_SLUG}}": { 
        "branchPattern": "feature/*" 
      }
    }
  }
}
```

Assume two developers are working on `feature/test` and `feature/test2` branches. In addition to `master` and `develop` buckets, the following states would be created:

**`feature-test.state.json`**

```json
{
  "cloudflare": {
    "r2": {
      "branch-feature--test": {
        "branch": "feature/test",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "config": {
          "branch": "feature/test",
          "branchPattern": "feature/*"
        }
      }
    }
  }
}
```

**`feature-test2.state.json`**

```json
{
  "cloudflare": {
    "r2": {
      "branch-feature--test2": {
        "branch": "feature/test2",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "config": {
          "branch": "feature/test2",
          "branchPattern": "feature/*"
        }
      }
    }
  }
}
```

When executing a plan for `feature/test`, the branch is locked, preventing any reads or writes to that branch's state.

## State Dependencies

Resources can depend on each other across branches. For instance, a staging server might be used to deploy both `develop` and `feature` branches.

### Example Configuration with Dependencies

```json
{
  "hcloud": {
    "servers": {
      "staging": {
        "type": "cpx21",
        "location": "fsn1"
      }
    }
  },
  "cloudflare": {
    "dns": {
      "golde.dev": {
        "A": {
          "dev": {
            "value": "{{state.servers.hcloud.staging.ipv4}}",
            "branch": "develop"
          },
          "{{git.BRANCH_SLUG}}": {
            "value": "{{state.servers.hcloud.staging.ipv4}}",
            "branchPattern": "feature/*"
          }
        }
      }
    }
  }
}
```

### Resulting DNS Records

- `develop` => `dev.golde.dev` points to the staging server.
- `feature/test` => `feature-test.golde.dev` points to the staging server.
- `feature/test2` => `feature-test2.golde.dev` points to the staging server.

### Planning and Execution with Dependencies

For the `feature/test` branch, the plan calculation includes:

```typescript
plan(
  {
    "cloudflare": {
      "dns": {
        "golde.dev": {
          "A": {
            "feature--test": {
              "value": "{{state.hcloud.servers.staging.ipv4}}",
              "branchPattern": "feature/*",
              "branch": "feature/test"
            }
          }
        }
      }
    }
  },
  {}
)
```

This plan creates a dependency on the `hcloud.severs.staging` resource:

```json
[
  {
    "type": "Create",
    "executor": "createDnsRecord",
    "args": ["cloudflare", "golde.dev", "A", "feature--test"],
    "dependsOn": ["hcloud.servers.staging.ipv4"]
  }
]
```

During execution, check the state of `hcloud.servers.staging.ipv4` to determine if it exists and which branch owns it:

```typescript
getStateForResource("hcloud.servers.staging.ipv4")
```

```json
{
  "branch": "develop",
  "resource": "hcloud.servers.staging",
  "state": { "ipv4": "123.123.123.123" }
}
```

A resource lock is applied to `feature/test`, and a partial lock on `develop`. The partial lock allows changes to `develop` unless they affect `hcloud.servers.staging.ipv4`. The full lock on `feature/test` ensures state consistency during updates.

```typescript
lockState("feature/test");
lockState("develop", ["hcloud.servers.staging"]);
```

After creating locks, re-run the plan for `feature/test` and handle any state dependencies. Upon completion, release the locks and update the feature branch's state.
