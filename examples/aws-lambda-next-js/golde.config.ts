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