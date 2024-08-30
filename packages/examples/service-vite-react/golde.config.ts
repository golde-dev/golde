
const config = {
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}"
    },
    cloudflare: {
      apiKey: "{{ env.CLOUDFLARE_API_KEY }}"
    }
  },
  dns: {
    "golde.dev": {
      type: "cloudflare",
      records: [
        {
          record: "vite-react",
          type: "A", 
          value: "77.253.204.36",
          ttl: "3600",
          proxied: false
        },
        {
          record: "vite-react-dev",
          type: "A", 
          value: "77.253.204.36",
          ttl: "3600",
          proxied: false
        }
      ]
    }
  },
  services: {
    viteReact: {
      type: "caddy",
      artifactsPaths: [
        "dist"
      ],
      staticServer: {
        "app": {
          match: "/",
          root: "dist",
        },
      },
      branchMapping: {
        master: {
          domain: "vite-react.golde.dev",
          hosts: [
            "77.253.204.36",
          ],
        },
        develop: {
          domain: "vite-react-dev.golde.dev",
          hosts: [
            "77.253.204.36",
          ],
        },
        "feature/*": {
          path: "{{ branchSlug }}",
          domain: "vite-react-dev.golde.dev",
          hosts: [
            "77.253.204.36",
          ],
        },
      },
    },
  }
};

export default config;