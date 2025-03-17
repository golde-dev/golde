import type { Config } from '@golde/cli';

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
    s3: {
      bucket: {
        "golde-example-aws-s3-object": {
          tags: {
            "BucketTag": "example-aws-s3-object",
          },
        }
      },
      object: {
        "includes.zip": {
          branch: "master",
          includes: [
            { from: "./src/nested", to: "." },
            { from: "./src/nested", to: "./moved/nested" },

            { from: "./src/base.txt", to: "./renamed.txt" },

            { from: "./src/test1.txt", to: "./moved" },
            { from: "./src/test2.txt", to: "./moved" },
          ],
          bucketName: "{{ state.aws.s3.bucket.golde-example-aws-s3-object.name }}",
        },
        "copy.txt": {
          branch: "master",
          source: "./src/base.txt",
          bucketName: "{{ state.aws.s3.bucket.golde-example-aws-s3-object.name }}",
        },
        "file-hash.copy.zip": {
          branch: "master",
          version: "FileHash",
          source: "./src/base.txt",
          bucketName: "{{ state.aws.s3.bucket.golde-example-aws-s3-object.name }}",
        },
        "file-last-updated.copy.zip": {
          branch: "master",
          version: "LastUpdated",
          source: "./src/base.txt",
          bucketName: "{{ state.aws.s3.bucket.golde-example-aws-s3-object.name }}",
        },
        "git-hash.copy.zip": {
          branch: "master",
          version: "GitHash",
          source: "./src/base.txt",
          bucketName: "{{ state.aws.s3.bucket.golde-example-aws-s3-object.name }}",
        },
        "git-hash-context.copy.zip": {
          branch: "master",
          version: "ContextGitHash",
          context: "./src",
          source: "base.txt",
          bucketName: "{{ state.aws.s3.bucket.golde-example-aws-s3-object.name }}",
        },
      }
    }
  }
};

export default config