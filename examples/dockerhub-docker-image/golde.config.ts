import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-docker-image-ghcr",
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
    docker: {
      registry: "{{ env.DOCKER_REGISTRY }}",
      username: "{{ env.DOCKER_USERNAME }}",
      password: "{{ env.DOCKER_PASSWORD }}",
    }
  },
  artifacts: {
    docker: {
      "example-docker-image-ghcr": {
        tags: {"latest": ""},
      }
    }
  }
};

export default config