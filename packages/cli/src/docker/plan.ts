import { PlanError, PlanErrorCode } from "../error.ts";
import {
  createImageDestroyPlan,
  createImageExecutors,
  createImagePlan,
} from "../docker/image/plan.ts";
import type { Context } from "../types/context.ts";
import type { Plan } from "../types/plan.ts";
import { isEmpty } from "../utils/object.ts";

export async function createDockerPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      docker: dockerState,
    } = {},
    config: {
      docker: dockerConfig,
    },
    docker,
    tags,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(dockerState) && isEmpty(dockerConfig)) {
    return [];
  }

  if (!docker) {
    throw new PlanError(
      "Docker provider is required when using docker, ensure that providers.docker or providers.golde is defined",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }

  const {
    images: imagesState,
  } = dockerState ?? {};

  const {
    images: imagesConfig,
  } = dockerConfig ?? {};

  const dockerExecutors = createImageExecutors(docker);
  plan.push(createImagePlan(
    dockerExecutors,
    tags,
    imagesState,
    imagesConfig,
  ));

  return (await Promise.all(plan)).flat();
}

export async function createDockerDestroyPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      docker: dockerState,
    } = {},
    docker,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(dockerState)) {
    return [];
  }

  if (!docker) {
    throw new PlanError(
      "Docker provider is required when using docker, ensure that providers.docker or providers.golde is defined",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }
  const {
    images: imagesState,
  } = dockerState ?? {};

  const dockerExecutors = createImageExecutors(docker);
  plan.push(createImageDestroyPlan(
    dockerExecutors,
    imagesState,
  ));

  return (await Promise.all(plan)).flat();
}
