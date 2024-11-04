import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-docker-image-golde",
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
  },
  artifacts: {
    docker: {
      "example-docker-image-golde": {
        tags: {"latest": ""},
      }
    }
  }
};

export default config