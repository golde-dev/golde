import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-aws-s3",
  tags: {
    Project: "GoldeExamples"
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
      "golde-example-aws-s3": {
        tags: {
          "BucketTag": "Example",
        },
      }
    }
  }
};

export default config