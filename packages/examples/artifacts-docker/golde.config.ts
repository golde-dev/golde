import type {Config} from '@golde/cli';

const config: Config = {
  name: "example-artifacts-docker",
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
      nodeApi: {
        tags: ["latest"],
      }
    }
  }
};

export default config