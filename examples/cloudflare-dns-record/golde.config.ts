import type {Config} from '@golde/cli'

const config: Config = {
  name: "example-cloudflare-dns-record",
  tags: {
    Project: "GoldeExamples",
    Stack: "example-cloudflare-dns-record",
    Branch: "{{ git.BRANCH_NAME }}",
  },
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
      record: {
        "golde-cf.dev": {
          "A": {
            "cloudflare-dns": {
              value: "192.168.1.1",
              branch: "master",
              ttl: 3600,
              proxied: false,
            },
            "dev.cloudflare-dns": {
              value: "192.168.1.1",
              branch: "develop",
              ttl: 3600,
              proxied: false,
            },
            "{{ git.BRANCH_SLUG }}-cloudflare-dns": {
              branchPattern: "feature/examples-cloudflare-dns*",
              value: "192.168.1.1",
              ttl: 3600,
              proxied: false,
            },
          }
        }
      }
    },
  },
};

export default config