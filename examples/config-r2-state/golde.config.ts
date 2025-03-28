import type { Config } from "@golde/cli";

const config: Config = {
  name: "example-config-fs-state",
  tags: {
    Project: "GoldeExamples",
    Stack: "example-config-fs-state",
    Branch: "{{ git.BRANCH_NAME }}",
  },
  state: {
    type: "s3",
    bucket: "example-config-r2-state",
    region: "auto",
    endpoint: "{{ env.S3_ENDPOINT}}",
    accessKeyId: "{{ env.S3_ACCESS_KEY }}",
    secretAccessKey: "{{ env.S3_SECRET_ACCESS_KEY }}",
  },
  providers: {
    cloudflare: {
      apiToken: "{{ env.CLOUDFLARE_API_TOKEN }}",
      accountId: "{{ env.CLOUDFLARE_ACCOUNT_ID }}",
    },
  },
  resources: {
    cloudflare: {
      r2: {
        bucket: {
          "example-config-r2-state-resource": {
            storageClass: "Standard"
          }
        }
      }
    }
  }
};

export default config