import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-aws-lambda-next-js",
  tags: {
    Project: "AWSLambdaNextJsExample"
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
        tags: {
          "Branch": "master",
        },
      },
      "example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}": {
        branchPattern: "feature/*",
        tags: {
          "Branch": `{{ git.BRANCH_NAME }}`,
        },
      }
    },
    s3Object: {
      "example-aws-lambda-next-js": {
        type: "zip",
        key: "lambda.zip",
        include: [".next/standalone/**", "public/**"],
        branch: "master",
        bucket: "{{ state.aws.s3.example-aws-lambda-next-js.arn }}",
      },
      "example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}": {
        type: "zip",
        key: "lambda.zip",
        include: ["dist/**"],
        branchPattern: "feature/*",
        bucket: "{{ state.aws.s3.example-aws-lambda-next-js-{{ git.BRANCH_SLUG }}.arn }}",
      },
    }
  }
};

export default config