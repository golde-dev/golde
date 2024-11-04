import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-dns-cloudflare",
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
  },
  aws: {
    s3: {
      
    }
  }
};

export default config