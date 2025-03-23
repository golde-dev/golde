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
    registry: {
      dockerImage: {
        "golde-dev/example-docker-image-golde-image-hash": {
          context: ".",
          version: "ImageHash"
        },
        "golde-dev/example-docker-image-golde-image-git-hash": {
          context: ".",
          version: "GitHash"
        }
      }
    }
  },
};

export default config