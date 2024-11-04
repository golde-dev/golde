import type { DockerClient } from "../client/docker.ts";
import type { Tags } from "../../types/config.ts";
import type { DockerImages, DockerImagesState } from "../types.ts";

export function createDockerExecutors(_: DockerClient) {
}

export async function createDockerArtifactsPlan(
  executors: ReturnType<typeof createDockerExecutors>,
  tags?: Tags,
  state?: DockerImagesState,
  config?: DockerImages,
) {
  console.log({
    executors,
    tags,
    state,
    config,
  });
  return await Promise.resolve([]);
}
