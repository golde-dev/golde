import type {Config} from "@golde/cli";

const config: Config = {
  name: "example-config-fs-state",
  state: {
    type: "fs"
  },
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    }
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