import { logger } from "@/logger.ts";
import { buildImage, createVersionTag } from "./utils.ts";
import { nowStringDate } from "@/utils/date.ts";
import { formatDuration } from "@/utils/duration.ts";
import type { DockerClient } from "../../../client/docker.ts";
import type { ImageConfig, ImageState } from "./types.ts";
import type { OmitExecutionContext, WithBranch } from "@/types/config.ts";

export interface RegistryClient {
  deletePackageVersion: (packageName: string, tag: string) => Promise<void>;
  deletePackage: (packageName: string) => Promise<void>;
}

export interface GenericExecutors {
  buildDockerImage: (imageName: string, config: ImageConfig) => Promise<{
    imageId: string;
    versionId: string;
  }>;
  createDockerImage: (
    imageName: string,
    imageId: string,
    version: string,
    config: WithBranch<ImageConfig>,
  ) => Promise<OmitExecutionContext<ImageState>>;
  updateDockerImage: (
    imageName: string,
    imageId: string,
    version: string,
    config: WithBranch<ImageConfig>,
    state: ImageState,
  ) => Promise<OmitExecutionContext<ImageState>>;
  deleteDockerImage: (imageName: string) => Promise<void>;
  deleteDockerImageTag: (imageName: string, tag: string) => Promise<void>;
  assertCreatePermission?: (imageName: string) => Promise<void>;
  assertDeletePermission?: (imageName: string) => Promise<void>;
  assertUpdatePermission?: (imageName: string) => Promise<void>;
}

export function createDockerImageExecutor(
  client: DockerClient,
  registryClient?: RegistryClient,
): GenericExecutors {
  const {
    provider,
    serviceName,
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
    logger.debug({
      config,
    }, `[Execute][${provider}] Pushed docker image ${imageName}:${versionId}`);
    const createdAt = nowStringDate();
    return {
      version,
      imageId,
      createdAt,
      config,
    };
  }

  async function deleteDockerImage(
    imageName: string,
  ): Promise<void> {
    if (!registryClient) {
      throw new Error("Registry client required for image deletion");
    }

    const start = performance.now();
    await registryClient.deletePackage(imageName);
    const end = performance.now();
    logger.debug(
      `[Execute][${provider}] Deleted ${serviceName} image ${imageName} in ${formatDuration(end - start)}`,
    );
  }

  async function deleteDockerImageTag(
    imageName: string,
    tag: string,
  ): Promise<void> {
    if (!registryClient) {
      throw new Error("Registry client required for image tag deletion");
    }

    const start = performance.now();
    await registryClient.deletePackageVersion(imageName, tag);
    const end = performance.now();
    logger.debug(
      `[Execute][${provider}] Deleted ${serviceName} image ${imageName}:${tag} in ${formatDuration(end - start)}`,
    );
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

    logger.debug({
      image,
      versionId,
    }, `[Plan][${provider}] Build docker image ${imageName}:${versionId}`);
    return {
      versionId,
      imageId,
    };
  }

  return {
    buildDockerImage,
    createDockerImage,
    deleteDockerImage,
    deleteDockerImageTag,
    updateDockerImage,
    assertCreatePermission,
    assertDeletePermission,
    assertUpdatePermission,
  };
}

export type Executors = ReturnType<typeof createDockerImageExecutor>;
