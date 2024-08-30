
const config = {
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}"
    },
    cloudflare: {
      apiKey: "{{ env.CLOUDFLARE_API_KEY }}"
    },
    hCloud: {
      token: "{{ env.HCLOUD_TOKEN }}"
    }
  },
  servers: {
    "hetzner-server-1": {
      type: "hCloud",
      serverType: "cpx11",
      image: "ubuntu-22.04",
      userData: "",
    },
    "hetzner-server-2": {
      type: "hCloud",
      serverType: "cpx11",
      image: "ubuntu-22.04",
      userData: ""
    }
  },
  dns: {
    "deployer.dev": {
      type: "cloudflare",
      records: {
        "hetzner-server-1": {
          record: "hetzner-server-1",
          type: "A", 
          value: "{{ servers.hetzner-server-1.ip_address }}",
          ttl: "3600",
          proxied: false, 
        },
      }
    }
  },
};

export default config;