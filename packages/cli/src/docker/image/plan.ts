import type { DockerClient } from "../client/client.ts";
import type { Tags } from "../../types/config.ts";
import type { ImagesConfig, ImagesState } from "../types.ts";

export function createImageExecutors(_: DockerClient) {
}

export async function createImagePlan(
  executors: ReturnType<typeof createImageExecutors>,
  tags?: Tags,
  state?: ImagesState,
  config?: ImagesConfig,
) {
  console.log({
    executors,
    tags,
    state,
    config,
  });
  return await Promise.resolve([]);
}
