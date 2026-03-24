# Golde

GitOps based infrastructure as code and deployment tool.

![Check](https://github.com/golde-dev/golde/actions/workflows/checks.yaml/badge.svg)

## What is it?

- Simple declarative infrastructure as code tool focused on common use cases. Starting with self-hosted infrastructure and major cloud providers.

- Git-based application deployments. All resources have specific branch ownership. Covers common use cases like containerized applications and static websites.

## What is it not?

- Terraform. It lacks the fancy configuration language, third-party providers, package manager, plugins and other features.

- Kubernetes. It is not a platform to abstract away all infrastructure details. Helm charts, complex networking are not in scope.

- Fly/Vercel. It will not provide fully managed services like databases, storage, CI/CD, etc.

## Why it is better

### Than terraform

- Easier to learn, no custom [configuration language](https://www.reddit.com/r/Terraform/comments/15pxr54/why_do_folks_hate_hcl_so_much/), no package manager, plugin system and different extensions tfstate, tfvars, etc.

- Easy to create higher-level abstractions using standard languages like TypeScript, JavaScript, Python, etc. No need for another orchestration layer like [terragrunt](https://terragrunt.gruntwork.io/)

- Map directly to common Git based deployment workflows, eliminate need for [multiple workspaces or env specific directories](https://medium.com/@b0ld8/terraform-manage-multiple-environments-63939f41c454)

- Deep schema validation and type safety for config. Planning performs permission simulations and existence checks. Reduces chances of a failed apply.

- Config has a better self-documenting structure, name of resource is part of config, not a separate property. Config maps directly to physical resources unlike terraform where resources are often meta-resources created for the sake of partitioning config.

- Properly open-sourced, so you can contribute and extend it without worrying about rug pulls. Monolithic structure and TypeScript make it very easy to contribute.

### Planned premium features

- State locking and concurrency control for state
- Cross project state references
- Managed docker registry
- Infrastructure agent to manage dedicated infrastructure
- Uptime monitoring and alerting
- Resource previews and infrastructure diagrams
- Feature flags and config management
- Logging and monitoring on top of deployed infrastructure

## Ok, give me examples

### Serverless next.js deploy

- Create necessary infrastructure in AWS
- Package artifacts and upload to s3
- Deploy next.js app on master branch and branches starting feature/*
- Pruning of feature branches resources

```ts
import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-aws-lambda-next-js",
  tags: {
    Project: "GoldeExamples",
    Example: "example-aws-lambda-next-js",
    Branch: "{{ git.BRANCH_NAME }}",
  },
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
          "example-aws-lambda-next-js": {
            branch: "master",
          },
          "example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}": {
            branchPattern: "feature/*",
          }
        },
        object: {
          "lambda-{{ git.BRANCH_HASH }}.zip": {
            includes: [
              {from: ".next/standalone", to: "."},
              {from: "bin/run.sh", to: "."},
              {from: "public", to: "public"},
            ],
            branch: "master",
            bucketName: "{{ state.aws.s3.bucket.example-aws-lambda-next-js.name }}",
          },
          "lambda-{{ git.BRANCH_SLUG }}-{{ git.BRANCH_HASH }}.zip": {
            includes: [
              {from: ".next/standalone", to: "."},
              {from: "bin/run.sh", to: "."},
              {from: "public", to: "public"},
            ],
            branchPattern: "feature/*",
            bucketName: "{{ state.aws.s3.bucket.example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}.name }}",
          },
        },
      },
      iam: {
        role: {
          "example-aws-lambda-next-js": {
            assumeRolePolicy: {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Action": "sts:AssumeRole",
                  "Principal": {
                    "Service": "lambda.amazonaws.com"
                  },
                  "Effect": "Allow",
                  "Sid": ""
                },
              ]
            },
            inlinePolicy: {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Action": [
                    "logs:PutLogEvents",
                  ],
                  "Resource": "arn:aws:logs:*:*:*",
                  "Effect": "Allow"
                }
              ]
            }
          }
        },
      },
      cloudwatch: {
        logGroup: {
          "/aws/lambda/example-aws-lambda-next-js": {
            branch: "master",
            retentionInDays: 60,
          },
          "/aws/lambda/example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}": {
            branchPattern: "feature/*",
            retentionInDays: 14,
          },
        },
      },
      lambda: {
        function: {
          "example-aws-lambda-next-js": {
            branch: "master",
            packageType: "Zip",
            description: "Example AWS Lambda Next.js",
            runtime: "nodejs20.x",
            handler: "index.handler",
            memorySize: 512,
            timeout: 30,
            roleArn: "{{ state.aws.iam.role.example-aws-lambda-next-js.arn }}",
            code: {
              s3Bucket: "{{ state.aws.s3.bucket.example-aws-lambda-next-js.name }}",
              s3Key: "lambda-{{ git.BRANCH_HASH }}.zip",
            },
            loggingConfig: {
              logGroupName: "{{ state.aws.cloudwatchLogGroup./aws/lambda/example-aws-lambda-next-js.name }}",
            }
          },
          "example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}": {
            branchPattern: "feature/*",
            packageType: "Zip",
            description: "Feature branch example AWS Lambda Next.js",
            runtime: "nodejs20.x",
            handler: "index.handler",
            memorySize: 256,
            timeout: 30,
            roleArn: "{{ state.aws.iam.role.example-aws-lambda-next-js.arn }}",
            code: {
              s3Bucket: "{{ state.aws.s3.bucket.example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}.name }}",
              s3Key: "lambda-{{ git.BRANCH_SLUG }}-{{ git.BRANCH_HASH }}.zip",
            },
            loggingConfig: {
              logGroupName: "{{ state.aws.cloudwatchLogGroup./aws/lambda/example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}.name }}",
            }
          },
        }
      }
    }
  },
};

export default config

```

But Marcin, how is this any different than CloudFormation or Terraform?
Because config is not YAML or JSON, it is actually very easy to build abstractions.

```ts
import type {Config} from '@golde/cli';
import {createAWSDeployment} from '@golde/nextjs';

const name = "example-aws-lambda-next-js"
const region = "us-east-1"
const aws = createAWSDeployment({
  name,
  region,
  customsAWS: {
    // Add any custom aws beside standard next js deployment
  }
});

const config: Config = {
  name: "example-aws-lambda-next-js",
  tags: {
    Project: "GoldeExamples",
    Example: "example-aws-lambda-next-js",
    Branch: "{{ git.BRANCH_NAME }}",
  },
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
    aws,
  },
};

export default config

```
