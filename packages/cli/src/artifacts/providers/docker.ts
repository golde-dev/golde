import type { DockerClient } from "../../clients/docker.ts";
import type { DockerImages, DockerImagesState } from "../types.ts";

export function createDockerExecutors(_: DockerClient) {
}

export async function createDockerArtifactsPlan(
  executors: ReturnType<typeof createDockerExecutors>,
  prevConfig?: DockerImages,
  prevState?: DockerImagesState,
  nextConfig?: DockerImages,
) {
  console.log({
    executors,
    prevConfig,
    prevState,
    nextConfig,
  });
  return await Promise.resolve([]);
}
