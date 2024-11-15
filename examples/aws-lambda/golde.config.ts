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
    lambdaFunction: {
      "example-aws-lambda-function": {
        packageType: "Zip",
        branch: "master",
        description: "Example AWS Lambda Function",
        runtime: "nodejs20.x",
        handler: "lambda.handler",
        memorySize: 512,
        timeout: 30,
        roleArn: "{{ state.aws.iamRole.example-aws-lambda-execution-role.arn }}",
        code: {
          ZipFile: "{{ file.lambda.zip }}",
        },
      },
    }
  }
};

export default config