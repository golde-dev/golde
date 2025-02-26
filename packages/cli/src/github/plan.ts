import { PlanError, PlanErrorCode } from "../error.ts";
import {
  createRegistryDockerImageDestroyPlan,
  createRegistryDockerImageExecutors,
  createRegistryDockerImagePlan,
} from "./resources/ghcrDockerImage/plan.ts";
import type { Context } from "../types/context.ts";
import type { Plan } from "../types/plan.ts";
import { isEmpty } from "../utils/object.ts";

export async function createGithubPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      github: githubState,
    } = {},
    config: {
      github: githubConfig,
    },
    github,
    tags,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(githubState) && isEmpty(githubConfig)) {
    return [];
  }

  if (!github) {
    throw new PlanError(
      "Github provider is required when using github resources",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }

  const {
    registryDockerImage: imagesState,
  } = githubState ?? {};

  const {
    registryDockerImage: imagesConfig,
  } = githubConfig ?? {};

  const dockerExecutors = createRegistryDockerImageExecutors(github);
  plan.push(createRegistryDockerImagePlan(
    dockerExecutors,
    tags,
    imagesState,
    imagesConfig,
  ));

  return (await Promise.all(plan)).flat();
}

export async function createGhcrDestroyPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      github: githubState,
    } = {},
    github,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(githubState)) {
    return [];
  }

  if (!github) {
    throw new PlanError(
      "Github provider is required when using github resources",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }
  const {
    registryDockerImage: imagesState,
  } = githubState ?? {};

  const dockerExecutors = createRegistryDockerImageExecutors(github);
  plan.push(createRegistryDockerImageDestroyPlan(
    dockerExecutors,
    imagesState,
  ));

  return (await Promise.all(plan)).flat();
}
