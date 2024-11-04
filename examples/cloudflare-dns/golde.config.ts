import type {Config} from '@golde/cli'

const config: Config = {
  name: "example-cloudflare-dns",
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
    cloudflare: {
      apiToken: "{{ env.CLOUDFLARE_API_TOKEN }}",
      accountId: "{{ env.CLOUDFLARE_ACCOUNT_ID }}"
    },
  },
  cloudflare: {
    dns: {
      "golde.dev": {
        "A": {
          "dns-cloudflare": {
            value: "",
            ttl: 3600,
            proxied: false, 
          },
          "dns-cloudflare-dev": {
            value: "",
            ttl: 3600,
            proxied: false,
          },
          "{{ git.BRANCH_SLUG }}-dns-cloudflare": {
            branchPattern: "feature/examples-dns-cloudflare*",
            value: "",
            ttl: 3600,
            proxied: false, 
          },
        }
      }
    },
  },
};

export default config