import { createDockerImagesPlanFactory } from "@/generic/resources/docker/image/plan.ts";
import { registryDockerImagePath } from "./path.ts";

const { createDockerImagesPlan, createDockerImagesDestroyPlan } = createDockerImagesPlanFactory(
  registryDockerImagePath,
  "Github",
  "GHCR",
);

export {
  createDockerImagesDestroyPlan as createRegistryDockerImageDestroyPlan,
  createDockerImagesPlan as createRegistryDockerImagePlan,
};
