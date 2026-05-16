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
  },
  resources: {
    hcloud: {
      sshKey: {
        "example-deploy": {
          publicKey: "{{ file(./id_ed25519.pub) }}",
          branch: "master",
        },
      },
      server: {
        "hetzner-server-1": {
          image: "ubuntu-22.04",
          serverType: "cpx11",
          location: "fsn1",
          sshKeys: ["{{ resources.hcloud.sshKey.example-deploy.name }}"],
          branch: "master",
        },
      },
      dns: {
        zone: {
          "golde.dev": {
            mode: "primary",
            ttl: 86400,
            branch: "master",
          },
        },
        record: {
          "golde.dev": {
            "A": {
              "hetzner-server-1": {
                value: "{{ resources.hcloud.server.hetzner-server-1.ipv4 }}",
                branch: "master",
                ttl: 3600,
              },
            },
          },
        },
      },
    },
  },
};

export default config
