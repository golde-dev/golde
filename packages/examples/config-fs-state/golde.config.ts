import type {Config} from "@golde/cli";

const config: Config = {
  name: "example-config-fs-state",
  state: {
    type: "fs"
  },
  providers: {
    cloudflare: {
      apiToken: "{{ env.CLOUDFLARE_API_TOKEN }}",
      accountId: "{{ env.CLOUDFLARE_ACCOUNT_ID }}",
    },
  },
  buckets: {
    cloudflare: {
      "example-config-fs-state": {
        storageClass: "Standard"
      }
    }
  }
};

export default config