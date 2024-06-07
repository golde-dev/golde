
const config = {
  providers: {
    deployer: {
      apiKey: "{{ env.DEPLOYER_API_KEY }}"
    },
    cloudflare: {
      apiKey: "{{ env.CLOUDFLARE_API_KEY }}"
    },
    state: {
      
    }
  },
};

export default config;