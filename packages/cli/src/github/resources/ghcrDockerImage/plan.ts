import type { Tags } from "../../../types/config.ts";
import type { GithubClient } from "../../client/client.ts";
import type { RegistryDockerImagesConfig, RegistryDockerImagesState } from "./types.ts";

export function createRegistryDockerImageExecutors(_: GithubClient) {
}

export async function createRegistryDockerImagePlan(
  executors: ReturnType<typeof createRegistryDockerImageExecutors>,
  tags?: Tags,
  state?: RegistryDockerImagesState,
  config?: RegistryDockerImagesConfig,
) {
  console.log({
    executors,
    tags,
    state,
    config,
  });
  return await Promise.resolve([]);
}

export async function createRegistryDockerImageDestroyPlan(
  executors: ReturnType<typeof createRegistryDockerImageExecutors>,
  state?: RegistryDockerImagesState,
) {
  console.log({
    executors,
    state,
  });
  return await Promise.resolve([]);
}
