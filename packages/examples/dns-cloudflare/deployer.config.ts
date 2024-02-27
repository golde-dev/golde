import type {Config} from '@tenacify/cli'


const config: Config = {
  providers: {
    cloudflare: {
      apiKey: "{{ env.CLOUDFLARE_API_KEY }}"
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
          "dev-dns-cloudflare": {
            value: "",
            ttl: 3600,
            proxied: false, 
          },
          "{{ git.BRANCH_SLUG }}-dns-cloudflare": {
            branchPattern: "feature/*",
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