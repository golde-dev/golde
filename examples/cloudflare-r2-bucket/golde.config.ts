import type { Config } from "@golde/cli";

const config: Config = {
  name: "example-cloudflare-r2-bucket",
  tags: {
    Project: "GoldeExamples",
    Stack: "example-cloudflare-r2-bucket",
    Branch: "{{ git.BRANCH_NAME }}",
  },
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
    cloudflare: {
      apiToken: "{{ env.CLOUDFLARE_API_TOKEN }}",
      accountId: "{{ env.CLOUDFLARE_ACCOUNT_ID }}",
    },
  },
  resources: {
    cloudflare: {
      r2: {
        bucket: {
          "example-cloudflare-r2-bucket": {
            storageClass: "Standard"
          }
        }
      }
    }
  }
};

export default config