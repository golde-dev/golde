import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-aws-cloudwatch-log-group",
  tags: {
    Project: "GoldeExamples",
    Stack: "example-aws-cloudwatch-log-group",
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
    cloudwatch: {
      logGroup: {
        "/aws/aws-cloudwatch-log-group": {
          retentionInDays: 30,
          tags: {
            "GroupTag": "Example Log tag",
          },
        }
      }
    }
  }
};

export default config