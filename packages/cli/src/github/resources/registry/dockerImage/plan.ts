import type { Tags } from "../../../../types/config.ts";
import type { GithubClient } from "../../../client/client.ts";
import type { RegistryDockerImagesConfig, RegistryDockerImagesState } from "./types.ts";

export function createRegistryDockerImageExecutors(_: GithubClient) {
}

export async function createRegistryDockerImagePlan(
  _executors: ReturnType<typeof createRegistryDockerImageExecutors>,
  _tags?: Tags,
  _state?: RegistryDockerImagesState,
  _config?: RegistryDockerImagesConfig,
) {
  return await Promise.resolve([]);
}

export async function createRegistryDockerImageDestroyPlan(
  _executors: ReturnType<typeof createRegistryDockerImageExecutors>,
  _state?: RegistryDockerImagesState,
) {
  return await Promise.resolve([]);
}
