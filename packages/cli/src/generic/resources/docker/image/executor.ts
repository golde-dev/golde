import { DockerClient } from "../../../client/docker.ts";
import { createVersionTag } from "./utils.ts";
import { nowStringDate } from "@/utils/date.ts";
import type { ImageConfig, ImageState } from "./types.ts";
import type { OmitExecutionContext, WithBranch } from "@/types/config.ts";

export async function createDockerImageExecutor(
  registry: string,
  username: string,
  password: string,
) {
  const client = new DockerClient(registry, username, password);

  await client.verifyInstalled();
  await client.verifyCredentials();

  function assertCreatePermission(_imageName: string) {
    return Promise.resolve();
  }

  function assertDeletePermission(_imageName: string) {
    return Promise.resolve();
  }

  function assertUpdatePermission(_imageName: string) {
    return Promise.resolve();
  }

  async function createDockerImage(
    imageName: string,
    imageId: string,
    version: string,
    config: WithBranch<ImageConfig>,
  ): Promise<OmitExecutionContext<ImageState>> {
    const {
      tags = [],
      branch,
    } = config;

    const tagsWithConfig = [
      ...tags,
      createVersionTag(branch, version),
    ];

    await client.login();
    await client.pushImage(imageName, imageId, tagsWithConfig);

    const createdAt = nowStringDate();
    return {
      version,
      imageId,
      createdAt,
      config,
    };
  }

  function deleteDockerImage(
    _imageName: string,
    _tag: string,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  function updateDockerImage(
    _imageName: string,
    _imageId: string,
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
