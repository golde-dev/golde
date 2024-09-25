import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-dns-cloudflare",
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
  },
  artifacts: {
    archive: {
      nodeApi: {
        tags: ["latest"],
      }
    }
  }
};

export default config