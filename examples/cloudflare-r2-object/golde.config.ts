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
    },
  },
  cloudflare: {
    r2: {
      bucket: {
        "example-bucket-r2-object": {
          storageClass: "Standard"
        }
      }
      object: {
        
      }
    }
  }
};

export default config