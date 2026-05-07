import type { Config } from '@golde/cli'

const config: Config = {
  name: "example-hcloud-server",
  tags: {
    Project: "GoldeExamples",
    Stack: "example-hcloud-server",
    Branch: "{{ git.BRANCH_NAME }}",
  },
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
    hcloud: {
      apiKey: "{{ env.HCLOUD_TOKEN }}",
    },
    cloudflare: {
      apiToken: "{{ env.CLOUDFLARE_API_TOKEN }}",
      accountId: "{{ env.CLOUDFLARE_ACCOUNT_ID }}",
    },
  },
  resources: {
    hcloud: {
      server: {
        "hetzner-server-1": {
          image: "ubuntu-22.04",
          serverType: "cpx11",
          location: "fsn1",
          branch: "master",
        },
      },
    },
    cloudflare: {
      dns: {
        record: {
          "golde-cf.dev": {
            "A": {
              "hetzner-server-1.golde-cf.dev": {
                value: "{{ resources.hcloud.server.hetzner-server-1.ipv4 }}",
                branch: "master",
                ttl: 3600,
                proxied: false,
              },
            },
          },
        },
      },
    },
  },
};

export default config
