import { isEmpty } from "moderndash";
import type { Plan } from "../types/plan.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import { createImageExecutors, createImagePlan } from "../docker/image/plan.ts";
import type { Context } from "../types/context.ts";

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
