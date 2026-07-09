---
title: Outputs & Hooks
description: Export values from your stack and trigger notifications on lifecycle events.
---

Golde separates two concerns that other IaC tools blur together: **outputs** are pure named
values derived from resource state, and **hooks** (`on`) are side effects triggered by
lifecycle events. Outputs never send anything anywhere; hooks never store anything.

## Outputs

Declare named values resolved from resource state after every apply:

```typescript
export default {
  name: "my-app",
  outputs: {
    apiUrl: "{{ resources.aws.appRunner.api.url }}",
    bucketArn: "{{ resources.aws.s3.bucket.assets.arn }}",
  },
};
```

After `golde apply` the resolved values are printed and persisted per branch in your
state backend. Read them back without planning or applying:

```bash
golde output              # all outputs as a table
golde output apiUrl       # raw value, script-friendly
golde output --json       # all outputs as JSON
API_URL=$(golde output apiUrl) npm run smoke-test
```

Values that cannot be resolved keep their raw template and log a warning — outputs never
fail an apply. `golde destroy` clears persisted outputs for the branch.

## Hooks (`on`)

Trigger actions when a run finishes. Events are keys, actions are listed under them:

```typescript
export default {
  name: "my-app",
  on: {
    success: [
      {
        discord: {
          webhook: "{{ env.DISCORD_WEBHOOK }}",
          message: "✅ {{ git.BRANCH_NAME }} deployed → {{ outputs.apiUrl }} ({{ run.changes }})",
        },
        branch: "master",
      },
      {
        slack: { channel: "#previews", text: "Preview ready: {{ outputs.apiUrl }}" },
        branchPattern: "feature/.*",
      },
    ],
    failure: [
      { webhook: { url: "https://ops.example.com/hook" } },
    ],
  },
};
```

### Events

| Event       | Fires when                                                    |
| ----------- | ------------------------------------------------------------- |
| `success`   | apply completed without errors                                 |
| `failure`   | apply or destroy errored (`{{ run.command }}` tells you which) |
| `changed`   | apply completed and resources were mutated (with `success`)    |
| `unchanged` | apply completed with nothing to do                             |
| `destroy`   | `golde destroy` completed                                      |
| `prune`     | reserved for `golde prune`                                     |

Hooks only fire when execution actually ran — never on `golde plan` or when you decline
the confirmation prompt. Hook failures are logged as warnings and never fail the run.

### Actions

- **`discord`** — `{ webhook, message }`. Posts to a Discord webhook URL; no provider config needed.
- **`slack`** — `{ channel, text }`. Uses the client from `providers.slack`.
- **`webhook`** — `{ url, method?, headers?, body? }`. Defaults to a `POST` with a JSON
  payload of `{ project, branch, event, run, outputs }`.

### Branch scoping

Every action accepts `branch` (exact match) and/or `branchPattern` (regex) — the same
git-native scoping resources use. Ping `#prod` from master, post preview URLs from
feature branches, stay silent everywhere else.

### Template context

Action strings can use all config templates plus two hook-specific contexts:

- `{{ outputs.NAME }}` — any declared output, freshly resolved after the run
- `{{ run.status }}` — `success` or `failure`
- `{{ run.command }}` — `apply`, `destroy`, or `prune`
- `{{ run.duration }}` — how long execution took
- `{{ run.changes }}` — human-readable summary, e.g. `3 created, 1 updated`
- `{{ run.error }}` — the error message on failure
- `{{ resources.* }}` — resource state attributes
