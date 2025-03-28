import type { Config } from "@golde/cli";

const config: Config = {
  name: "example-cloudflare-d1-database",
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
      d1: {
        database: {
          "example-cloudflare-d1-database": {
            branch: "master",
            locationHint: "apac",
          }
        }
      }
    }
  }
};

export default config