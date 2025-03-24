import type { DockerClient } from "../../../client/docker.ts";
import { buildImage, createVersionTag } from "./utils.ts";
import { nowStringDate } from "@/utils/date.ts";
import type { ImageConfig, ImageState } from "./types.ts";
import type { OmitExecutionContext, WithBranch } from "@/types/config.ts";
import { logger } from "@/logger.ts";

export function createDockerImageExecutor(client: DockerClient) {
  const {
    provider,
  } = client.getProviderInfo();

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

    const versionId = createVersionTag(branch, version);
    const tagsWithConfig = [
      ...tags,
      versionId,
    ];

    await client.login();
    await client.pushImage(imageName, imageId, tagsWithConfig);
    logger.debug(`[Execute][${provider}] Pushed docker image ${imageName}:${versionId}`, {
      config,
    });
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

  async function buildDockerImage(
    imageName: string,
    image: ImageConfig,
  ) {
    const { versionId, imageId } = await buildImage({
      client,
      imageName,
      image,
    });

    logger.debug(`[Plan][${provider}] Build docker image ${imageName}:${versionId}`, {
      image,
      versionId,
    });
    return {
      versionId,
      imageId,
    };
  }

  return {
    buildDockerImage,
    createDockerImage,
    deleteDockerImage,
    updateDockerImage,
    assertCreatePermission,
    assertDeletePermission,
    assertUpdatePermission,
  };
}
