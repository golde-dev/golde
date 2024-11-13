# Golde

GitOps based infrastructure as code and deployment tool.

![Check](https://github.com/golde-dev/golde/actions/workflows/checks.yaml/badge.svg)

## What is it?

- Simple declarative infrastructure as code tool with focus on common use cases. Initial focus is on self hosted infrastructure and big cloud providers.

- Git bases application deployments. All resources have specific branch ownership. Deployment will cover common use cases like containerized applications and static websites.

## What is it not?

- Terraform. It lacks fancy configuration language, third party providers, package manager, plugins and other features.

- Kubernetes. It is not platform to abstract away all infrastructure details. Helm charts, complex networking is not in scope.

- Fly/Vercel. It will not provided fully managed services like databases, storage, CI/CD, etc.

## Why it is better

### Than terraform

- Easier to learn, no custom [configuration language](https://www.reddit.com/r/Terraform/comments/15pxr54/why_do_folks_hate_hcl_so_much/), no package manager, plugin system and different extensions tfstate, tfvars, etc.

- Easy to create higher level abstractions using standard language like typescript, javascript, python, etc. No need to for another orchestration layer like [terragrunt](https://terragrunt.gruntwork.io/)

- Map directly to common Git based deployment workflows, eliminate need for [multiple workspaces or env specific directories](https://medium.com/@b0ld8/terraform-manage-multiple-environments-63939f41c454)

- Deep schema validations and type safety of config. Planning performs permission simulations and existence checks. Reduce chances of failed apply.

- Config have better self documenting structure, name of resource is part of config, not a separate property. Easier to understand if resource will be created on not.

- Properly open-sourced, so you can contribute and extend it without worrying about rug pulls. Monolithic structure and typescript makes it very easy to contribute.

### Planned premium features

- State locking and concurrency control for state
- Cross project state references
- Managed docker registry,
- Infrastructure agent to manage dedicated infrastructure.
- Uptime monitoring and alerting
- Resources previews and infrastructure diagrams
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
  aws: {
    s3Bucket: {
      "example-aws-lambda-next-js": {
        branch: "master",
      },
      "example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}": {
        branchPattern: "feature/*",
      }
    },
    s3Object: {
      "lambda-{{ git.BRANCH_HASH }}.zip": {
        type: "zip",
        include: [
          {from: ".next/standalone", to: "."},
          {from: "bin/run.sh", to: "."},
          {from: "public", to: "public"},
        ],
        branch: "master",
        bucket: "{{ state.aws.s3.example-aws-lambda-next-js.arn }}",
      },
      "lambda-{{ git.BRANCH_SLUG }}-{{ git.BRANCH_HASH }}.zip": {
        type: "zip",
        include: [
          {from: ".next/standalone", to: "."},
          {from: "bin/run.sh", to: "."},
          {from: "public", to: "public"},
        ],
        branchPattern: "feature/*",
        bucket: "{{ state.aws.s3.example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}.arn }}",
      },
    },
    iamRole: {
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
        policies: [
          {
            "Action": [
              "logs:PutLogEvents",
            ],
            "Resource": "arn:aws:logs:*:*:*",
            "Effect": "Allow"
          }
        ]
      }
    },
    cloudWatchLogGroup: {
      "/aws/lambda/example-aws-lambda-next-js": {
        branch: "master",
        retentionInDays: 60,
      },
      "/aws/lambda/example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}": {
        branchPattern: "feature/*",
        retentionInDays: 14,
      },
    },
    lambda: {
      "example-aws-lambda-next-js": {
        branch: "master",
        description: "Example AWS Lambda Next.js",
        runtime: "nodejs22.x",
        handler: "index.handler",
        memorySize: 512,
        timeout: 30,
        role: "{{ state.aws.iamRole.example-aws-lambda-next-js.arn }}",
        code: {
          s3bucket: "{{ state.aws.s3.example-aws-lambda-next-js.arn }}",
          s3Key: "{{ lambda-{{ git.BRANCH_SLUG }}-{{ git.BRANCH_HASH }}.zip }}",
        },
        loggingConfig: {
          logGroup: "{{ state.aws.cloudWatchLogGroup.example-aws-lambda-next-js.arn }}",
        }
      },
      "example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}": {
        branchPattern: "feature/*",
        description: "Feature branch example AWS Lambda Next.js",
        runtime: "nodejs22.x",
        handler: "index.handler",
        memorySize: 256,
        timeout: 30,
        role: "{{ state.aws.iamRole.example-aws-lambda-next-js.arn }}",
        cade: {
          s3bucket: "{{ state.aws.s3.example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}.arn }}",
          s3Key: "{{ lambda-{{ git.BRANCH_HASH }}.zip }}",
        },
        loggingConfig: {
          logGroup: "{{ state.aws.cloudWatchLogGroup.example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}.arn }}",
        }
      },
    }
  }, 
  output: {
    type: "file",
    path: "./output.json",
    data: {
      "$If": [
        {branch: "master"},
        {
          logGroupName: "/aws/lambda/example-aws-lambda-next-js",
          lambdaArn: "{{ state.aws.iamRole.example-aws-lambda-next-js.arn }}",
        },
        {
          logGroupName: "/aws/lambda/example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}",
          lambdaArn: "{{ state.aws.iamRole.example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}.arn }}",
        }
      ]
    }
  }
};

export default config

```

But Marcin, how this is no different than cloudformation or terraform?.
Because config is not yaml or json it is actually very easy to build abstraction.

```ts
import type {Config} from '@golde/cli';
import {
  createAWSDeployment, 
  createAWSDeploymentOutputData
} from '@golde/nextjs';

const name = "example-aws-lambda-next-js"
const region = "us-east-1"
const aws = createAWSDeployment({
  name,
  region,
  customsAWS: {
    // Add any custom aws beside standard next js deployment
  }
});

const output = createAWSDeploymentOutputData({
  name,
  region,
  customOutput: {
    // Add any custom output beside standard next js deployment
  }
})

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
  aws,
  output: {
    type: "file",
    path: "./output.json",
    data: output,
  }
};

export default config

```
