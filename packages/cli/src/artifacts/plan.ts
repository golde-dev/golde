import { isEmpty } from "moderndash";
import type { Plan } from "../types/plan.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import type { Context } from "../context.ts";
import {
  createDockerArtifactsPlan,
  createDockerExecutors,
} from "./providers/docker.ts";

export async function createArtifactsPlan(context: Context): Promise<Plan> {
  const {
    previousConfig: {
      artifacts: prevArtifactsConfig,
    } = {},
    previousState: {
      artifacts: prevArtifactsState,
    } = {},
    nextConfig: {
      artifacts: nextArtifactsConfig,
    },
    docker,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (
    !isEmpty(prevArtifactsConfig?.docker) ||
    !isEmpty(nextArtifactsConfig?.docker)
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
      prevArtifactsConfig?.docker,
      prevArtifactsState?.docker,
      nextArtifactsConfig?.docker,
    ));
  }

  return (await Promise.all(plan)).flat();
}
