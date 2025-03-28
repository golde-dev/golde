import { ensureAllowedKeys } from "@/utils/object.ts";
import { matchFactory } from "@/generic/path.ts";
import type { ContainerConfig, ContainerState } from "./types.ts";

export const BASE_PATH = "golde.docker.container";

const stateAttributes = ensureAllowedKeys<ContainerState>({
  createdAt: true,
  updatedAt: true,
}).map((attribute) => `${attribute}`);

const configAttributes = ensureAllowedKeys<ContainerConfig>({
  server: true,
  image: true,
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const {
  matchResourceType,
  resourcePath,
  removeResourcePrefix,
} = matchFactory(BASE_PATH, "Golde", "Docker", stateAttributes, configAttributes);

export {
  matchResourceType as matchDockerContainerPath,
  removeResourcePrefix as removeDockerContainerPrefix,
  resourcePath as dockerContainerPath,
};
