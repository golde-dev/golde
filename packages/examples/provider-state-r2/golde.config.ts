
const config = {
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}"
    },
    cloudflare: {
      apiKey: "{{ env.CLOUDFLARE_API_KEY }}"
    },
    state: {
      
    }
  },
};

export default config;