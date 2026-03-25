# Golde CLI

GitOps-based infrastructure as code and deployment tool. See the [main repository](https://github.com/golde-dev/golde) for full overview.

## Install

```sh
curl -fsSL https://download.golde.dev/install-golde-cli.sh | bash
```

Or via npm:

```sh
npm install -g @golde/cli
```

## Quick Start

1. Configure your API key:

```sh
golde configure
```

1. Initialize a new project:

```sh
golde init
```

1. Define your infrastructure in `golde.config.ts`:

```ts
import type { Config } from "@golde/cli";

const config: Config = {
  name: "my-first-project",
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
    aws: {
      accessKeyId: "{{ env.AWS_ACCESS_KEY_ID }}",
      secretAccessKey: "{{ env.AWS_SECRET_ACCESS_KEY }}",
    },
  },
  resources: {
    aws: {
      s3: {
        bucket: {
          "my-first-bucket": {
            tags: {
              Environment: "production",
            },
          },
        },
      },
    },
  },
};

export default config;
```

1. Preview and apply:

```sh
golde plan          # Preview what will change
golde apply         # Apply the changes
golde apply --yes   # Apply without confirmation prompt
```

## CLI Commands

| Command     | Description                            | Key Flags                          |
| ----------- | -------------------------------------- | ---------------------------------- |
| `configure` | Set up Golde API key                   |                                    |
| `init`      | Initialize a new project               |                                    |
| `show`      | Display resolved config for current branch | `-a, --all`, `-f, --format`    |
| `state`     | Show current infrastructure state      |                                    |
| `validate`  | Validate configuration without applying |                                   |
| `plan`      | Preview changes without applying       |                                    |
| `apply`     | Apply infrastructure changes           | `-y, --yes`                        |
| `destroy`   | Tear down all resources                | `-y, --yes`, `-a, --all`           |

All commands support `-c, --config <path>` to specify a custom config file, `-l, --logLevel <level>` to set log verbosity, and `-j, --json` for structured log output.

**Typical workflow:**

```sh
golde validate    # Check config is valid
golde plan        # See what would change
golde apply       # Make it happen
```

## Configuration

### Supported formats

Golde looks for config files in this order:

- `golde.config.ts` (TypeScript)
- `golde.config.js` (JavaScript)
- `golde.config.cjs` (CommonJS)
- `golde.config.json` (JSON)
- `golde.yaml` / `golde.yml` (YAML)
- `golde.toml` (TOML)

Or specify a custom path: `golde apply --config path/to/config.ts`

### Config structure

```ts
{
  name: string;                        // Project name (used as state key)
  tags?: Record<string, string>;       // Global tags, merged into all resources
  state?: StateConfig;                 // State backend config (default: Golde API)
  providers?: ProvidersConfig;         // Provider credentials
  resources?: Resources;               // Infrastructure definitions
  outputs?: Outputs;                   // Post-apply outputs
}
```

Environment variables are automatically loaded from a `.env` file in the project root.

## Templates

Templates use `{{ }}` syntax and are resolved in this order:

| Template | Description | Example |
| -------- | ----------- | ------- |
| `{{ env.VAR }}` | Environment variable | `{{ env.AWS_ACCESS_KEY_ID }}` |
| `{{ file(path) }}` | File contents | `{{ file(./key.pem) }}` |
| `{{ git.BRANCH_NAME }}` | Current git branch | `feature/login` |
| `{{ git.BRANCH_SLUG }}` | URL-safe branch slug | `feature-login` |
| `{{ config.key }}` | Managed config value | `{{ config.region }}` |
| `{{ state.provider.type.name.attr }}` | Resource state reference | `{{ state.aws.iamRole.my-role.arn }}` |

Templates can be nested and used in resource names:

```ts
// On branch "feature/login", creates bucket "my-app-feature-login"
"my-app-{{ git.BRANCH_SLUG }}": {
  branchPattern: "feature/*",
}
```

## Examples

### Cloudflare DNS with branch-based routing

Production gets `app.example.com`, each feature branch gets a preview subdomain like `feature-login-app.example.com`:

```ts
import type { Config } from "@golde/cli";

const config: Config = {
  name: "my-app-dns",
  providers: {
    cloudflare: {
      apiToken: "{{ env.CLOUDFLARE_API_TOKEN }}",
      accountId: "{{ env.CLOUDFLARE_ACCOUNT_ID }}",
    },
  },
  resources: {
    cloudflare: {
      dns: {
        record: {
          "example.com": {
            A: {
              // Production DNS record
              "app": {
                value: "203.0.113.10",
                branch: "master",
                ttl: 3600,
                proxied: true,
              },
              // Preview DNS record per feature branch
              "{{ git.BRANCH_SLUG }}-app": {
                value: "203.0.113.20",
                branchPattern: "feature/*",
                ttl: 300,
                proxied: false,
              },
            },
          },
        },
      },
    },
  },
};

export default config;
```

### AWS Lambda with cross-resource dependencies

IAM role and CloudWatch log group are created automatically before the Lambda function via `{{ state.* }}` template references:

```ts
import type { Config } from "@golde/cli";

const config: Config = {
  name: "my-api",
  tags: {
    Project: "MyAPI",
    Branch: "{{ git.BRANCH_NAME }}",
  },
  providers: {
    golde: { apiKey: "{{ env.GOLDE_API_KEY }}" },
    aws: {
      accessKeyId: "{{ env.AWS_ACCESS_KEY_ID }}",
      secretAccessKey: "{{ env.AWS_SECRET_ACCESS_KEY }}",
    },
  },
  resources: {
    aws: {
      iam: {
        role: {
          "my-api-lambda-role": {
            assumeRolePolicy: {
              Version: "2012-10-17",
              Statement: [{
                Action: "sts:AssumeRole",
                Principal: { Service: "lambda.amazonaws.com" },
                Effect: "Allow",
              }],
            },
            managedPoliciesArns: [
              "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            ],
          },
        },
      },
      cloudwatch: {
        logGroup: {
          "/aws/lambda/my-api": {
            retentionInDays: 30,
          },
        },
      },
      lambda: {
        function: {
          "my-api": {
            packageType: "Zip",
            runtime: "nodejs20.x",
            handler: "index.handler",
            memorySize: 512,
            timeout: 30,
            roleArn: "{{ state.aws.iamRole.my-api-lambda-role.arn }}",
            code: {
              zipFile: "./dist/lambda.zip",
            },
            loggingConfig: {
              logGroupName: "{{ state.aws.cloudwatchLogGroup./aws/lambda/my-api.name }}",
            },
          },
        },
      },
    },
  },
};

export default config;
```

### Docker image build and container deployment

Build a Docker image to GitHub Container Registry, then deploy it as a container via Golde agent:

```ts
import type { Config } from "@golde/cli";

const config: Config = {
  name: "my-web-app",
  providers: {
    golde: { apiKey: "{{ env.GOLDE_API_KEY }}" },
    github: {
      username: "{{ env.GITHUB_USERNAME }}",
      accessToken: "{{ env.GITHUB_ACCESS_TOKEN }}",
    },
  },
  resources: {
    github: {
      registry: {
        dockerImage: {
          "my-org/my-web-app": {
            context: ".",
            version: "ImageHash",
          },
        },
      },
    },
    golde: {
      docker: {
        container: {
          "my-web-app": {
            server: "my-server",
            image: "{{ resource.github.registry.dockerImage.my-org/my-web-app }}",
          },
        },
      },
    },
  },
};

export default config;
```

## Branch-Based Deployments

Every resource can be scoped to specific git branches:

```ts
resources: {
  aws: {
    s3: {
      bucket: {
        // No branch field: defaults to master
        "app-production": {},

        // Exact match: only on develop
        "app-staging": {
          branch: "develop",
        },

        // Glob pattern: one bucket per feature branch
        "app-{{ git.BRANCH_SLUG }}": {
          branchPattern: "feature/*",
        },
      },
    },
  },
}
```

Golde automatically filters resources based on the current git branch. Use `golde destroy` to tear down resources for the current branch, or `golde destroy --all` for all branches.

## State Backends

### Default (Golde API)

No configuration needed. State is managed automatically.

### Filesystem

Local development, state stored in `.golde/` directory:

```ts
state: {
  type: "fs",
}
```

### S3-compatible

Works with AWS S3, Cloudflare R2, MinIO, and other S3-compatible storage:

```ts
state: {
  type: "s3",
  bucket: "my-state-bucket",
  region: "us-east-1",
  endpoint: "{{ env.S3_ENDPOINT }}",
  accessKeyId: "{{ env.S3_ACCESS_KEY }}",
  secretAccessKey: "{{ env.S3_SECRET_ACCESS_KEY }}",
}
```

## Supported Resources

| Provider       | Service    | Resource      | Description                         |
| -------------- | ---------- | ------------- | ----------------------------------- |
| **AWS**        | S3         | `bucket`      | S3 buckets                          |
|                | S3         | `object`      | File uploads and zip packaging      |
|                | Lambda     | `function`    | Lambda functions                    |
|                | IAM        | `role`        | IAM roles with policies             |
|                | IAM        | `user`        | IAM users                           |
|                | CloudWatch | `logGroup`    | Log groups with retention           |
|                | Route53    | `record`      | DNS records                         |
|                | App Runner | `service`     | App Runner services                 |
| **Cloudflare** | DNS        | `record`      | DNS records (A, AAAA, CNAME, etc.)  |
|                | R2         | `bucket`      | R2 storage buckets                  |
|                | R2         | `object`      | R2 objects                          |
|                | D1         | `database`    | Serverless SQL databases            |
| **GitHub**     | Registry   | `dockerImage` | GHCR container images               |
| **Golde**      | Docker     | `container`   | Managed container deployment        |

## Links

- [Repository](https://github.com/golde-dev/golde)
- [Issues](https://github.com/golde-dev/golde/issues)
- [License](https://github.com/golde-dev/golde/blob/master/LICENSE)
