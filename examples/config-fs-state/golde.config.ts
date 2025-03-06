import type {Config} from "@golde/cli";

const config: Config = {
  name: "example-config-fs-state",
  tags: {
    Project: "GoldeExamples",
    Stack: "example-config-fs-state",
    Branch: "{{ git.BRANCH_NAME }}",
  },
  state: {
    type: "fs"
  },
  providers: {
    cloudflare: {
      apiToken: "{{ env.CLOUDFLARE_API_TOKEN }}",
      accountId: "{{ env.CLOUDFLARE_ACCOUNT_ID }}",
    },
  },
  cloudflare: {
    r2: {
      bucket: {
        "example-config-fs-state": {
          storageClass: "Standard"
        }
      }
    }
  }
};

export default config