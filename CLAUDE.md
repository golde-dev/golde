# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Golde?

Golde is a GitOps-based infrastructure as code and deployment tool. It's a declarative IaC tool with focus on common use cases, git-based application deployments with branch-specific resource ownership, and simplified infrastructure management without complex configuration languages.

**Key differentiators:**

- TypeScript/JavaScript/Python-based configuration (no HCL)
- Git branch-based resource ownership (master vs feature/* branches)
- Template system for dynamic configuration (`{{ env.VAR }}`, `{{ git.BRANCH }}`, `{{ state.aws.s3.bucket.arn }}`)
- Deep schema validation with Zod
- Automatic dependency resolution via template references
- Multiple state backends (Golde API, S3, filesystem)

## Development Commands

### Building and Compilation

```bash
# Build all packages in parallel
yarn dist

# Build development versions (faster, includes sourcemaps)
yarn dev

# Watch mode - auto-rebuild and publish CLI on changes
yarn dev:watch
```

### Testing

```bash
# Run all tests in parallel (agent + cli)
yarn test

# Run tests for a specific package
yarn test:agent
yarn test:cli

# Run a single test by name/pattern
yarn test "ResourceName"  # Passes as --filter argument to Deno
```

### Linting

```bash
# Lint all packages (uses Deno lint for agent/cli, eslint for rest)
yarn lint

# Lint specific packages
yarn lint:agent
yarn lint:cli
yarn lint:rest
```

### Local Development Workflow

```bash
# Build dev versions, publish to local, then clean up
yarn dev
# This creates local.json with timestamped version and publishes CLI to global

# Watch for changes and auto-rebuild
yarn dev:watch
```

### Publishing

```bash
# Create new version (requires master branch)
yarn version

# Publish packages to npm/registries
yarn publish
```

## Architecture Overview

### Monorepo Structure

```
packages/
├── cli/          # Main CLI tool (Deno-based)
├── agent/        # Infrastructure agent for self-hosted (Deno-based)
├── docs/         # Documentation site
└── nextjs/       # Higher-level abstractions for Next.js deployments
```

**Key technologies:**

- Runtime: Deno for CLI and agent packages
- Build: Lerna-lite for monorepo versioning and publishing
- Validation: Zod v4 for schema validation
- Logging: Pino for structured logging
- Task runner: Custom @chyzwar/runner

### CLI Command Flow

```
golde apply [--branch <name>] [--yes]
  ↓
1. Load config (golde.config.ts/json/yaml/toml)
  ↓
2. Resolve templates (env → file → git → config → state)
  ↓
3. Filter to branch (if specified)
  ↓
4. Initialize context (create provider clients: AWS, Cloudflare, GitHub, etc.)
  ↓
5. Fetch previous state from backend
  ↓
6. Generate plan (parallel for each provider)
  ↓
7. Resolve dependencies (extract from template references)
  ↓
8. Validate plan (ensure dependencies satisfied)
  ↓
9. Prompt user (unless --yes)
  ↓
10. Execute plan (sequential with dependency ordering)
  ↓
11. Save state changes
  ↓
12. Generate outputs
```

### Resource Architecture

All resources follow a **hierarchical path pattern**:

```
Type: aws.s3.bucket
Path: aws.s3.bucket.my-bucket.arn
      ^^^ provider  ^^^ type  ^^^ name  ^^^ attribute
```

**Resource lifecycle states:**

- Create: New resource needed
- CreateVersion: Create new version of versioned resource
- Update: Update existing resource
- UpdateVersion: Update versioned resource
- Delete: Remove resource
- DeleteVersion: Remove resource version
- ChangeVersion: Switch active version
- Noop: No changes needed

**Each resource type implements:**

```
provider/resources/service/type/
├── types.ts         # TypeScript interfaces
├── schema.ts        # Zod validation schemas
├── path.ts          # Path parsing/matching
├── executor.ts      # Create/update/delete operations
└── plan.ts          # Plan generation logic
```

### Configuration System

**Template resolution order:**

1. Environment variables: `{{ env.VAR_NAME }}`
2. File contents: `{{ file.path/to/file }}`
3. Git info: `{{ git.BRANCH_NAME }}`, `{{ git.BRANCH_SLUG }}`, `{{ git.BRANCH_HASH }}`
4. Managed config: `{{ config.key }}`
5. Resource state: `{{ state.aws.s3.bucket-name.arn }}`

**Branch-based resource control:**

```typescript
{
  branch: "master"              // Only deploy on master
  branchPattern: "feature/*"    // Deploy on feature branches
}
```

Resources without these fields apply to all branches.

### Dependency Resolution

Dependencies are **automatically extracted** from template references:

```typescript
// Lambda depends on S3 bucket and IAM role
lambda: {
  "my-function": {
    role: "{{ state.aws.iamRole.lambda-role.arn }}",  // dependency
    code: {
      s3Bucket: "{{ state.aws.s3.my-bucket.name }}"   // dependency
    }
  }
}
```

The system:

1. Parses all template references
2. Matches against resource paths
3. Builds execution graph
4. Executes in topological order

### State Management

**Abstract state client** with implementations:

- **S3StateClient**: Production state in AWS S3
- **FSStateClient**: Local development state in filesystem
- **GoldeClient**: Managed state via Golde API

State stores:

- Resource path and current attributes
- Applied configuration
- Version information (for versioned resources)
- Timestamps (createdAt, updatedAt)

### Supported Providers

- **AWS**: S3, Lambda, IAM, CloudWatch Logs, Route53, AppRunner
- **Cloudflare**: DNS records, R2 storage, D1 databases, Pages projects
- **GitHub**: Repositories, secrets, container registry (GHCR)
- **Golde**: Managed infrastructure (Docker containers, static sites)
- **Hetzner Cloud**: Servers (schema only)
- **Docker Hub**: Image management
- **Slack**: Notifications and outputs

## Important Implementation Notes

### Deno-specific Considerations

The CLI and agent packages use **Deno** (not Node.js):

- Use `deno.json` for configuration and dependencies
- Permissions must be explicitly granted (--allow-net, --allow-read, etc.)
- JSR and npm imports are specified in `imports` section
- Use `@std/*` for standard library instead of Node.js builtins where possible

**Compilation process:**

- `compile.ts`: Compiles Deno TypeScript to standalone executable
- `package.ts` (CLI only): Uses @deno/dnt to create npm-compatible package
- `publish.ts`: Publishes compiled artifacts

### Running Individual Package Tests

```bash
# CLI tests
cd packages/cli
deno test --allow-env --allow-read --allow-run

# Agent tests
cd packages/agent
deno test --allow-env --allow-read --allow-run

# Test specific file
deno test --allow-env --allow-read --allow-run --filter "test name"
```

### Common Compilation/Build Tasks

**CLI package:**

```bash
cd packages/cli

# Generate JSON schemas from Zod
deno task schema

# Compile to standalone binary
deno task compile

# Package for npm
deno task package

# Full build pipeline
deno task dist
```

**Agent package:**

```bash
cd packages/agent

# Compile to standalone binary
deno task compile

# Full build pipeline
deno task dist
```

### Key Files to Understand

**CLI package structure:**

- `src/cli.ts`: Commander-based CLI entry point with all commands
- `src/config.ts`: Config loading, template resolution, branch filtering
- `src/context.ts`: Provider client initialization
- `src/plan.ts`: Plan generation across all providers
- `src/apply.ts`: Plan execution with dependency ordering
- `src/dependencies.ts`: Dependency graph construction
- `src/schema.ts`: Zod schemas for config validation
- `src/types/`: TypeScript type definitions
- `src/utils/template.ts`: Template resolution system
- `src/utils/git.ts`: Git operations (branch name, commit hash, etc.)
- `src/state/`: State backend implementations
- `src/aws/`, `src/cloudflare/`, etc.: Provider-specific implementations

**Agent package structure:**

- `src/bin/agent.ts`: Agent CLI entry point
- `src/start.ts`: Agent startup logic
- `src/install.ts`: Agent installation to systemd
- `src/unit.ts`: Systemd unit management

### Adding a New Resource Type

1. Create directory: `src/PROVIDER/resources/SERVICE/RESOURCE_TYPE/`
2. Define types: `types.ts` with Config and State interfaces
3. Create schema: `schema.ts` with Zod validation
4. Implement path parser: `path.ts` with path extraction and matching
5. Create executor: `executor.ts` with create/update/delete functions
6. Implement plan: `plan.ts` with plan generation logic
7. Add to provider schema: Update `src/PROVIDER/schema.ts`
8. Add to provider plan: Update `src/PROVIDER/plan.ts`
9. Export from mod: Update `src/PROVIDER/mod.ts`
10. Regenerate schemas: `cd packages/cli && deno task schema`

### Versioned Resources

Some resources support **multiple versions** (e.g., Docker images, Lambda layers):

- Each version stored separately in state
- One version marked as `isCurrent: true`
- Allows rollbacks and blue-green deployments
- Use `maxVersions` to limit stored versions

Implementation requires:

- `version` field in config type
- `VersionedConfig` and `VersionedState` types
- Version comparison logic in plan generator
- `CreateVersion`, `UpdateVersion`, `DeleteVersion` plan types

### Branch-Based Infrastructure Pattern

**Master branch** (production):

```typescript
aws: {
  s3Bucket: {
    "my-app": { branch: "master" }  // Only on master
  }
}
```

**Feature branches** (staging):

```typescript
aws: {
  s3Bucket: {
    "my-app-{{ git.BRANCH_SLUG }}": {
      branchPattern: "feature/*"  // On feature branches
    }
  }
}
```

**Cleanup:**

```bash
golde prune  # Removes resources from deleted branches
```

### Error Handling

Custom error types with codes:

- `ConfigError`: Config loading/validation errors (ConfigErrorCode enum)
- `ContextError`: Provider initialization errors (ContextErrorCode enum)
- `PlanError`: Plan generation errors (PlanErrorCode enum)

Always log with structured context using Pino logger.

### Logging Standards

Use Pino structured logging:

```typescript
logger.debug({ resource, plan }, "[Component] Debug message");
logger.info(`[Component] Info message with ${variable}`);
logger.warn({ error }, "[Component] Warning message");
logger.error(error, "[Component] Error message");
```

**Log prefixes:**

- `[Config]`: Configuration loading/resolution
- `[Context]`: Context initialization
- `[Plan]`: Plan generation
- `[Apply]`: Plan execution
- `[State]`: State operations
- `[Provider]`: Provider-specific operations (e.g., `[AWS]`, `[Cloudflare]`)

### Testing Conventions

- Tests use Deno's standard testing framework
- Assertions via `@std/assert` or `@std/expect`
- Test files named `*_test.ts` or in `__tests__/` directory
- Mock external API calls (AWS SDK, Cloudflare API, etc.)
- Use fixtures for test data when appropriate

## Project Philosophy

**Key principles from README:**

- **Simpler than Terraform**: No custom config language, no plugin system, no tfstate/tfvars complexity
- **TypeScript for abstractions**: Easy to build higher-level helpers (like `@golde/nextjs`)
- **Git-native workflows**: Branch-based deployments without manual workspace management
- **Self-documenting**: Resource names are part of config structure, not separate properties
- **Monolithic and contribution-friendly**: TypeScript monorepo, easy to contribute new providers/resources
- **Type-safe and validated**: Zod schemas provide deep validation before apply

**What Golde is NOT:**

- Not Terraform (no HCL, no third-party providers, no plugin ecosystem)
- Not Kubernetes (no complex networking, no Helm charts)
- Not Fly/Vercel (no fully managed services like databases, CI/CD)

## Git Workflow

**Main branch:** `master`

**Branch naming:**

- `feature/*`: New features
- `fix/*`: Bug fixes
- `chore/*`: Maintenance tasks

**Commits:** Uses conventional commits (enforced by commitlint)

- `feat(scope): description`
- `fix(scope): description`
- `chore(scope): description`

**Pre-commit hooks:** Lint-staged runs linter on changed files

## Release Process

Managed by Lerna-lite:

1. `yarn version`: Creates new version, tags, updates CHANGELOG.md
2. `yarn publish`: Publishes to npm and other registries
3. GitHub releases created automatically

Versioning is **independent** per package but coordinated via lerna.json.
