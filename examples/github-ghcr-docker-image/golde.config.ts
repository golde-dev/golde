import type {Config} from "@golde/cli";

const config: Config = {
  name: "example-github-docker-image",
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
    github: {
      username: "{{ env.GITHUB_USERNAME }}",
      accessToken: "{{ env.GITHUB_ACCESS_TOKEN }}"
    }
  },
  github: {
    registryDockerImage: {
      "@golde-dev/example-docker-image-golde": {
        context: ".",
        tags: {"latest": true},
      }
    }
  },
};

export default config