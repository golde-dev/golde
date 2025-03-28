import type { Config } from '@golde/cli';

const config: Config = {
  name: "example-next-js-aws-lambda",
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
  resources: {
    aws: {
      s3: {
        bucket: {
          "example-next-js-aws-lambda": {
            branch: "master",
          },
        },
        object: {
          "lambda-{{ git.BRANCH_SLUG }}.zip": {
            includes: [
              { from: ".next/standalone", to: "." },
              { from: "bin/run.sh", to: "." },
              { from: "public", to: "public" },
            ],
            branch: "master",
            bucketName: "{{ resources.aws.s3.bucket.example-next-js-aws-lambda.name }}",
          },
          "lambda-feature-{{ git.BRANCH_SLUG }}.zip": {
            includes: [
              { from: ".next/standalone", to: "." },
              { from: "bin/run.sh", to: "." },
              { from: "public", to: "public" },
            ],
            branchPattern: "feature/*",
            bucketName: "{{ resources.aws.s3.bucket.example-next-js-aws-lambda.name }}",
          },
        },
      },
      iam: {
        role: {
          "example-next-js-aws-lambda": {
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
            managedPoliciesArns: [
              "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
            ]
          }
        },
      },
      cloudwatch: {
        logGroup: {
          "/aws/lambda/example-next-js-aws-lambda": {
            branch: "master",
            retentionInDays: 60,
          },
          "/aws/lambda/example-next-js-aws-lambda-{{ git.BRANCH_SLUG }}": {
            branchPattern: "feature/*",
            retentionInDays: 14,
          },
        }
      },
      lambda: {
        function: {
          "example-next-js-aws-lambda": {
            branch: "master",
            description: "Example AWS Lambda Next.js",
            runtime: "nodejs20.x",
            handler: "index.handler",
            packageType: "Zip",
            memorySize: 512,
            timeout: 30,
            roleArn: "{{ resources.aws.iamRole.example-next-js-aws-lambda.arn }}",
            code: {
              s3Bucket: "{{ resources.aws.s3.example-next-js-aws-lambda.arn }}",
              s3Key: "{{ resources.aws.s3.example-next-js-aws-lambda.key }}",
            },
            loggingConfig: {
              logGroupName: "{{ resources.aws.cloudWatchLogGroup.example-next-js-aws-lambda.name }}",
            }
          },
          "example-next-js-aws-lambda-{{ git.BRANCH_SLUG }}": {
            branchPattern: "feature/*",
            description: "Feature branch example AWS Lambda Next.js",
            runtime: "nodejs20.x",
            packageType: "Zip",
            handler: "index.handler",
            memorySize: 256,
            timeout: 30,
            roleArn: "{{ resources.aws.iamRole.example-next-js-aws-lambda.arn }}",
            code: {
              s3Bucket: "{{ resources.aws.s3.example-next-js-aws-lambda-{{ git.BRANCH_SLUG }}.arn }}",
              s3Key: "{{ lambda-{{ git.BRANCH_HASH }}.zip }}",
            },
            loggingConfig: {
              logGroupName: "{{ resources.aws.cloudWatchLogGroup.example-next-js-aws-lambda-{{ git.BRANCH_SLUG }}.arn }}",
            }
          },
        }
      }
    },
  }
  // output: {
  //   type: "file",
  //   path: "./output.json",
  //   data: {
  //     "$If": [
  //       {branch: "master"},
  //       {
  //         logGroupName: "/aws/lambda/example-aws-lambda-next-js",
  //         lambdaArn: "{{ resources.aws.iamRole.example-aws-lambda-next-js.arn }}",
  //       },
  //       {
  //         logGroupName: "/aws/lambda/example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}",
  //         lambdaArn: "{{ resources.aws.iamRole.example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}.arn }}",
  //       }
  //     ]
  //   }
  // }
};

export default config