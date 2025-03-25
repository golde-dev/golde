import type {Config} from "@golde/cli";

const config: Config = {
  name: "example-bucket-r2-object",
  tags: {
    Project: "GoldeExamples",
    Stack: "example-bucket-r2-object",
    Branch: "{{ git.BRANCH_NAME }}",
  },
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
    cloudflare: {
      apiToken: "{{ env.CLOUDFLARE_API_TOKEN }}",
      accountId: "{{ env.CLOUDFLARE_ACCOUNT_ID }}",
      s3: {
        endpoint: "{{ env.CLOUDFLARE_S3_ENDPOINT }}",
        accessKeyId: "{{ env.CLOUDFLARE_S3_ACCESS_KEY_ID }}",
        secretAccessKey: "{{ env.CLOUDFLARE_S3_SECRET_ACCESS_KEY }}",
      }
    },
  },
  cloudflare: {
    r2: {
      bucket: {
        "example-bucket-r2-object": {
          storageClass: "Standard"
        }
      },
      object: {
        "copy.txt": {
          branch: "master",
          source: "./src/base.txt",
          bucketName: "{{ state.cloudflare.r2.bucket.example-bucket-r2-object.name }}",
        },
      }
    }
  }
};

export default config