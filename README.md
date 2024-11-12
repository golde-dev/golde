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

## Ok, give me examples

### Serverless next.js deploy

- it would create necessary infrastructure in AWS
- deploy next.js app on master branch and branches starting feature/*
- handle cleanup of merged feature branches

```ts
import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-aws-lambda-next-js",
  tags: {
    Project: "AWSLambdaNextJsExample",
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
    s3: {
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
