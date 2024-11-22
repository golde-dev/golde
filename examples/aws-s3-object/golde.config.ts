import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-aws-s3-object",
  tags: {
    Project: "GoldeExamples",
    Stack: "example-aws-s3-object",
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
      "golde-example-aws-s3-object": {
        tags: {
          "BucketTag": "Example",
        },
      }
    },
    s3Object: {
      "include.zip": {
        branch: "master",
        includes: [
          {from: "./src/nested", to: "."},
          {from: "./src/nested", to: "./moved/nested"},

          {from: "./src/base.txt", to: "./renamed.txt"},

          {from: "./src/test1.txt", to: "./moved"},
          {from: "./src/test2.txt", to: "./moved"},
        ],
        bucketArn: "{{ state.aws.s3.golde-example-aws-s3-object.arn }}",
      },
      "copy.txt": {
        branch: "master",
        source: "./src/base.txt",
        bucketArn: "{{ state.aws.s3.golde-example-aws-s3-object.arn }}",
      },
    }
  }
};

export default config