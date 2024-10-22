# Config and state management

## General structure

- Each resource will have implicit or explicit `branch` ownership
- Each resource can also have `branchPattern` which will be used to match multiple branches.
- State is partitioned by branch name.
- Changes to state are locked to the branch.

Given config like this:

```json
{
  "buckets": {
    "cloudflare": {
      "bucket1": {
        "branch": "master"
      },
      "bucket2": {
        "branch": "develop"
      }
    }
  }
}
```

Would result into following state when fully executed on both branches:

```json
// master.state.json
{
  "buckets": {
    "cloudflare": {
      "bucket1": {
        "branch": "master",
        "createdAt": "2024-01-01T00:00:00.000Z", 
        "config": {
          "branch": "master"
        }
      }
    }
  }
}
```

```json
// develop.state.json
{
  "buckets": {
    "cloudflare": {
      "bucket2": {
        "branch": "develop",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "config": {
          "branch": "develop"
        }
      }
    }
  }
}
```

To avoid conflict and race conditions state is partitioned by branch name. When calculating plan we only consider config and state for the current branch. This makes planning simple and deterministic.

For example when running on `master` plan would be calculated as following function

```ts
plan(currentBranchState, currentBranchConfig): ExecutionGroups
```

```ts
plan(
  {
    "buckets": {
      "cloudflare": {
        "bucket1": {
          "branch": "master"
        }
      }
    }, 
    {
    "buckets": {
      "cloudflare": {
        "bucket1": {
          "branch": "master",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "config": {
            "branch": "master"
          }
        }
      }
    }
  }
})
```

Result of plan is number of changes to state (Create, Update, Delete, Noop).

## Branch patterns

For example there might be resource that is created for each feature/* branch using git template.

```json
{
  "buckets": {
    "cloudflare": {
      "bucket1": {
        "branch": "master"
      },
      "bucket2": {
        "branch": "develop"
      },
      "branch-{{ git.BRANCH_SLUG}}": {
        "branch": "{{ git.BRANCH_NAME }}",
        "branchPattern": "feature/*"
      }
    }
  }
}
```

Assuming two developers are working on feature branches `feature/test` and `feature/test2`

In addition to master and develop buckets, following state would be created:

```json
// feature/test.state.json
{
  "buckets": {
    "cloudflare": {
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

```json
// feature/test2.state.json
{
  "buckets": {
    "cloudflare": {
      "branch-feature--test": {   
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

When executing plan for `feature/test` we will create lock for that that branch preventing any reads and writes to that branch state.

## State dependencies

Another common use case is when resources depends on each other across branches. We might have one staging server that would be used to deploy both develop and feature branches.

```json
{
  "servers": {
    "hcloud": {
      "staging": {
        "type": "cpx21",
        "location": "fsn1"
      }
    }
  }, 
  "dns": {
    "cloudflare": {
      "golde.dev": {
          "A": {
            "dev": {
              "value": "{{ state.servers.hcloud.staging.ipv4 }}",
              "branch": "develop"
            },
            "{{ git.BRANCH_SLUG }}": {
              "value": "{{ state.servers.hcloud.staging.ipv4 }}",
              "branchPattern": "feature/*",
              "branch": "{{ git.BRANCH_SLUG }}"
            }
          },
        },
      },
    }
  }
```

Assuming we have two feature branches `feature/test` and `feature/test2`
We would create dns records like

- `develop` => `dev.golde.dev` would point to staging server.
- `feature/test` => `feature--test.golde.dev` would point to staging server.
- `feature/test2` `feature--test2.golde.dev` would point to staging server.

For this case planing and execution would be slightly different.

on feature/test branch plan would be calculated as following:

```ts
plan(
  {
  "dns": {
    "cloudflare": {
      "golde.dev": {
          "A": {
            "feature--test": {
              "value": "{{ state.servers.hcloud.staging.ipv4 }}",
              "branchPattern": "feature/*",
              "branch": "feature/test"
            }
          },
        },
      },
    }
  }, 
  {}
)
```

This would result to a plan with dependency on `servers.hcloud.staging` resource.

```js
[
  {
    "type": "Create",
    "executor": "createDnsRecord",
    "args": ["cloudflare", "golde.dev", "A", "feature--test"],
    "dependsOn": ["servers.hcloud.staging.ipv4"]
  }
]
```

During execution we first check `servers.hcloud.staging.ipv4`to find if state exist and what branch is an owner.

```ts
getStateForResource("servers.hcloud.staging.ipv4")
```

```json
{
  "branch": "develop",
  "resource": "servers.hcloud.staging",
  "state": {
    "ipv4": "123.123.123.123"
  }
}
```

At this point we know that there is a need to create lock on both `develop` and `feature/test` branches as there is specific dependency.

We create full lock on `feature/test` branch and partial lock on `develop` branch.
Thanks to partial lock we could still make changes to develop branch as long there is no changes to `servers.hcloud.staging.ipv4` resource. We want to create full lock on `feature/test` because during state update we will read value of whole state and overwrite state once execution is complete.

```ts
lockState("feature/test")
lockState("develop", [
  "servers.hcloud.staging"
])
```

Once locks are created we would re-run plan for `feature/test` branch and resolve any state dependencies.

Once execution is complete we would release locks and update state for feature branch.
