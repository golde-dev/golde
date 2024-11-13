import type {Config} from '@golde/cli';

const config: Config = {
  name: "aws-cloudwatch-log-group",
  tags: {
    Project: "GoldeExamples",
    Example: "example-aws-cloudwatch-log-group",
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
    cloudwatchLogGroup: {
      "golde-example-aws-s3-bucket": {
        tags: {
          "GroupTag": "Example",
        },
      }
    }
  }
};

export default config