
const config = {
  providers: {
    deployer: {
      apiKey: "{{ env.DEPLOYER_KEY }}"
    },
    cloudflare: {
      apiKey: "{{ env.CLOUDFLARE_KEY }}"
    },
    hCloud: {
      TOKEN: "{{ env.HCLOUD_TOKEN }}"
    }
  },
  servers: {
    "hetzner-server-1": {
      type: "hCloud",
      serverType: "cpx11",
      image: "ubuntu-22.04",
      userData: "",
      firewall: {
        type: "ufw"
      }
    },
    "hetzner-server-2": {
      type: "hCloud",
      serverType: "cpx11",
      image: "ubuntu-22.04",
      userData: `
      install-deployer
    
      `,
      firewall: {
        type: "ufw"
      }
    }
  },
  dns: {
    "deployer.dev": {
      type: "cloudflare",
      records: [
        {
          record: "hetzner-server-1",
          type: "A", 
          value: "{{ servers.hetzner-server-1.ip_address }}",
          ttl: "3600",
          proxied: false, 
        },
      ]
    }
  },
};