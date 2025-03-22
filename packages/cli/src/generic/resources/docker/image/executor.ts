import type { OmitExecutionContext } from "@/types/config.ts";
import { DockerClient } from "../../../client/docker.ts";
import type { ImageConfig, ImageState } from "./types.ts";

export async function createDockerImageExecutor(
  registry: string,
  username: string,
  password: string,
) {
  const client = new DockerClient(registry, username, password);

  await client.verifyInstalled();
  await client.verifyCredentials();

  function assertCreatePermission(_repositoryName: string) {
    return Promise.resolve();
  }

  function assertDeletePermission(_repositoryName: string) {
    return Promise.resolve();
  }

  function assertUpdatePermission(_repositoryName: string) {
    return Promise.resolve();
  }

  function createDockerImage(
    _repositoryName: string,
    _version: string,
    _config: ImageConfig,
  ): Promise<OmitExecutionContext<ImageState>> {
    throw new Error("Method not implemented.");
  }

  function deleteDockerImage(_repositoryName: string, _version: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  function updateDockerImage(
    _repositoryName: string,
    _version: string,
    _config: ImageConfig,
    _state: ImageState,
  ): Promise<OmitExecutionContext<ImageState>> {
    throw new Error("Method not implemented.");
  }

  return {
    client,
    createDockerImage,
    deleteDockerImage,
    updateDockerImage,
    assertCreatePermission,
    assertDeletePermission,
    assertUpdatePermission,
  };
}
