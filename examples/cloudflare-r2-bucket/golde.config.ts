import type {Config} from "@golde/cli";

const config: Config = {
  name: "example-cloudflare-r2-bucket",
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
      "example-cloudflare-r2-bucket": {
        storageClass: "Standard"
      }
    }
  }
};

export default config