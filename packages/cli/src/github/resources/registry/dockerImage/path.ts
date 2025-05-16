import { ensureAllowedKeys } from "@/utils/object.ts";
import type { ImageConfig, ImageState } from "../../../../generic/resources/docker/image/types.ts";
import { matchFactory } from "@/generic/path.ts";

export const BASE_PATH = "github.registry.dockerImage";

const stateAttributes = ensureAllowedKeys<ImageState>({
  createdAt: true,
  updatedAt: true,
  imageId: true,
  version: true,
}).map((attribute) => `${attribute}`);

const configAttributes = ensureAllowedKeys<ImageConfig>({
  version: true,
  context: true,
  maxVersions: true,
  dockerfile: true,
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const {
  matchResourceType,
  resourcePath,
  removeResourcePrefix,
} = matchFactory(BASE_PATH, "Github", "DockerImage", stateAttributes, configAttributes);

export {
  matchResourceType as matchRegistryDockerImagePath,
  removeResourcePrefix as removeRegistryDockerImagePrefix,
  resourcePath as registryDockerImagePath,
};
