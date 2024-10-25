
const config = {
  providers: {
    cloudflare: {
      apiKey: "{{ env.CLOUDFLARE_API_KEY }}"
    },
  },
  dns: {
    cloudflare: {
      "golde.dev": {
        records: {
          "vite-react-node": {
            type: "A", 
            value: "{{ state.servers.hetzner-server-1.ip_address }}",
            ttl: "3600",
            proxied: false, 
          },
        }
      }
    },
  },
};

export default config