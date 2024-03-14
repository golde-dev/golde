import type {Config} from '@tenacify/cli'

const config: Config = {
  project: "example-dns-cloudflare",
  providers: {
    deployer: {
      apiKey: "{{ env.DEPLOYER_API_KEY }}",
    },
    cloudflare: {
      apiToken: "{{ env.CLOUDFLARE_API_TOKEN }}",
      accountId: "{{ env.CLOUDFLARE_ACCOUNT_ID }}"
    },
  },
  dns: {
    cloudflare: {
      "deployer.dev": {
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