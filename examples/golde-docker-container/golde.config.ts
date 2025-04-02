import type { Config } from "@golde/cli";

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
  resources: {
    github: {
      registry: {
        dockerImage: {
          "golde-dev/golde-docker-container": {
            context: ".",
            version: "ImageHash"
          },
        }
      }
    },
    golde: {
      docker: {
        container: {
          "example-docker-container-golde-container-hash": {
            server: "",
            image: "{{ resource.github.registry.dockerImage.golde-dev/golde-docker-container }}",
          }
        }
      } 
    }
  }
};

export default config