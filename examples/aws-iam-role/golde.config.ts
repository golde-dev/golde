import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-aws-aim-role",
  tags: {
    Project: "GoldeExamples",
    Example: "example-aws-aim-role",
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
      "example-aws-aim-role": {
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
        inlinePolicy: {
          Version: "2012-10-17",
          Statement: [
            {
              "Action": [
                "logs:PutLogEvents",
              ],
              "Resource": "arn:aws:logs:*:*:*",
              "Effect": "Allow"
            }
          ],
        },
        managedPoliciesArns: [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ]
      }
    },
  }
};

export default config