import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-aws-lambda",
  tags: {
    Project: "GoldeExamples",
    Stack: "example-aws-lambda",
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
    iamRole: {
      "example-aws-lambda-execution-role": {
        assumeRolePolicy: {
          Version: "2012-10-17",
          Statement: [
            {
              "Action": "sts:AssumeRole",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Effect": "Allow",
            },
          ]
        }, 
        managedPoliciesArns: [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ]
      }
    },
    cloudwatchLogGroup: {
      "/aws/lambda/example-aws-lambda": {
        retentionInDays: 30,
      }
    },
    lambdaFunction: {
      "example-aws-lambda-function-local-zip": {
        packageType: "Zip",
        branch: "master",
        description: "Example AWS Lambda Function local Zip",
        runtime: "nodejs20.x",
        handler: "lambda.handler",
        memorySize: 512,
        timeout: 30,
        roleArn: "{{ state.aws.iamRole.example-aws-lambda-execution-role.arn }}",
        tags: {
          "LambdaTag": "Example lambda tag",
        },
        code: {
          zipFile: "./lambda.zip"
        },
      },
      "example-aws-lambda-function-log-group": {
        packageType: "Zip",
        branch: "master",
        description: "Example AWS Lambda Function local Zip",
        runtime: "nodejs20.x",
        handler: "lambda.handler",
        memorySize: 512,
        timeout: 30,
        roleArn: "{{ state.aws.iamRole.example-aws-lambda-execution-role.arn }}",
        tags: {
          "LambdaTag": "Example lambda tag",
        },
        code: {
          zipFile: "./lambda.zip"
        },
        loggingConfig: {
          logGroupName: "{{ state.aws.cloudwatchLogGroup./aws/lambda/example-aws-lambda.name }}",
        },
      },
    }
  }
};

export default config