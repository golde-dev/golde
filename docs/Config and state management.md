# Configuration and State Management

## General Structure

- State is segmented by branch name, meaning each Git branch maintains its own state. This can be stored as a file or a database row. State is a collection of resources.

- Each resource is associated with a `branch`, either implicitly or explicitly. If neither `branch` nor `branchPattern` is specified, it defaults to the repository's default branch. If a `branchPattern` is used, the resource is assigned to the current branch.

- Resources can also specify a `branchPattern`, which matches multiple branches. When a branch matches the pattern, a new resource is created for that branch.

- When executing changes, only the current branch's state is read and written. Dependencies on other branches are resolved by reading those branches' state.

> **Note:** Branch locking is planned but not yet fully implemented. Currently, only the Golde API backend supports locking. The filesystem and S3 state backends do not enforce locks.

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
  "cloudflare.r2.bucket.bucket1": {
    "path": "cloudflare.r2.bucket.bucket1",
    "state": { "name": "bucket1" },
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "cloudflare.r2.bucket.bucket2": {
    "path": "cloudflare.r2.bucket.bucket2",
    "state": { "name": "bucket2" },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**`develop.state.json`**

```json
{
  "cloudflare.r2.bucket.bucket3": {
    "path": "cloudflare.r2.bucket.bucket3",
    "state": { "name": "bucket3" },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

States are partitioned by branch to avoid conflicts and race conditions. While calculating a plan, only the config and state for the current branch are considered, ensuring the process is straightforward and predictable.

### Planning Example

For the `master` branch, the plan calculation can be represented conceptually as follows:

```typescript
plan(currentBranchConfig, currentBranchState): Plan
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
    "cloudflare.r2.bucket.bucket1": {
      "path": "cloudflare.r2.bucket.bucket1",
      "state": { "name": "bucket1" },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
)
```

The plan results in changes to the state, such as Create, Update, Delete, or Noop.

## Branch Patterns

Resources can be created for each `feature/*` branch using the Git template. If a `branchPattern` is used, it automatically matches the current branch.

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
  "cloudflare.r2.bucket.branch-feature-test": {
    "path": "cloudflare.r2.bucket.branch-feature-test",
    "state": { "name": "branch-feature-test" },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**`feature-test2.state.json`**

```json
{
  "cloudflare.r2.bucket.branch-feature-test2": {
    "path": "cloudflare.r2.bucket.branch-feature-test2",
    "state": { "name": "branch-feature-test2" },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

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
            "value": "{{ resources.hcloud.servers.staging.ipv4 }}",
            "branch": "develop"
          },
          "{{git.BRANCH_SLUG}}": {
            "value": "{{ resources.hcloud.servers.staging.ipv4 }}",
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
            "feature-test": {
              "value": "{{ resources.hcloud.servers.staging.ipv4 }}",
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

This plan creates a dependency on the `hcloud.servers.staging` resource:

```json
[
  {
    "type": "Create",
    "executor": "createDnsRecord",
    "args": ["cloudflare", "golde.dev", "A", "feature-test"],
    "dependsOn": ["hcloud.servers.staging.ipv4"]
  }
]
```

During execution, the system checks the state of `hcloud.servers.staging` to determine if it exists and which branch owns it:

```typescript
getStateForResource("hcloud.servers.staging.ipv4")
```

```json
{
  "path": "hcloud.servers.staging",
  "state": { "ipv4": "123.123.123.123" },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

> **Note:** The locking mechanism described below is planned but not yet fully implemented. Currently, only the Golde API backend supports locking. The filesystem and S3 state backends do not enforce locks.

When locking is available, a resource lock would be applied to `feature/test`, and a partial lock on `develop`. The partial lock allows changes to `develop` unless they affect `hcloud.servers.staging`. The full lock on `feature/test` ensures state consistency during updates.

```typescript
lockState("feature/test");
lockState("develop", ["hcloud.servers.staging"]);
```

After creating locks, the plan for `feature/test` is re-run and any state dependencies are resolved. Upon completion, the locks are released and the feature branch's state is updated.
