import { isEmpty } from "../utils/object.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import { createDockerContainerExecutors } from "./resources/docker/container/executor.ts";
import type { Context } from "../types/context.ts";
import type { Plan } from "../types/plan.ts";
import {
  createDockerContainerDestroyPlan,
  createDockerContainerPlan,
} from "./resources/docker/container/plan.ts";

export async function createGoldePlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      golde: goldeState,
    } = {},
    config: {
      resources: {
        golde: goldeConfig,
      } = {},
    },
    golde,
    tags,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(goldeState) && isEmpty(goldeConfig)) {
    return [];
  }

  if (!golde) {
    throw new PlanError(
      "Golde provider is required when using golde resources",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }

  const {
    docker: {
      container: containersState,
    } = {},
  } = goldeState ?? {};

  const {
    docker: {
      container: containersConfig,
    } = {},
  } = goldeConfig ?? {};

  if (!isEmpty(containersState) || !isEmpty(containersConfig)) {
    const executors = createDockerContainerExecutors(golde);

    plan.push(createDockerContainerPlan(
      executors,
      tags,
      containersState,
      containersConfig,
    ));
  }

  return (await Promise.all(plan)).flat();
}

export async function createGoldeDestroyPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      golde: goldeState,
    } = {},
    golde,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(goldeState)) {
    return [];
  }

  if (!golde) {
    throw new PlanError(
      "Golde provider is required when using golde resources",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }
  const {
    docker: {
      container: containersState,
    } = {},
  } = goldeState ?? {};

  if (!isEmpty(containersState)) {
    const executors = createDockerContainerExecutors(golde);
    plan.push(createDockerContainerDestroyPlan(
      executors,
      containersState,
    ));
  }

  return (await Promise.all(plan)).flat();
}
