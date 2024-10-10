import { DockerProvider } from "../../providers/docker.ts";
import { DockerImages, DockerImagesState } from "../types.ts";

export function createDockerExecutors(docker: DockerProvider) {
}

export async function createDockerArtifactsPlan(
  executors: ReturnType<typeof createDockerExecutors>,
  prevConfig?: DockerImages,
  prevState?: DockerImagesState,
  nextConfig?: DockerImages,
) {
  return Promise.resolve([]);
}
