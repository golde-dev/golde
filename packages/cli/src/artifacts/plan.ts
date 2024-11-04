import { isEmpty } from "moderndash";
import type { Plan } from "../types/plan.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import { createDockerArtifactsPlan, createDockerExecutors } from "./docker/plan.ts";
import type { Context } from "../types/context.ts";

export async function createArtifactsPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      artifacts: {
        docker: dockerState,
      } = {},
    } = {},
    config: {
      artifacts: {
        docker: dockerConfig,
      } = {},
    },
    docker,
    tags,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (
    !isEmpty(dockerState) ||
    !isEmpty(dockerConfig)
  ) {
    if (!docker) {
      throw new PlanError(
        "Docker is required when using docker artifacts",
        PlanErrorCode.PROVIDER_MISSING,
      );
    }
    const dockerExecutors = createDockerExecutors(docker);
    plan.push(createDockerArtifactsPlan(
      dockerExecutors,
      tags,
      dockerState,
      dockerConfig,
    ));
  }

  return (await Promise.all(plan)).flat();
}
