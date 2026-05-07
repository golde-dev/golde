import { logger } from "../logger.ts";
import { isEmpty } from "../utils/object.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import { createServerDestroyPlan, createServerPlan } from "./resources/server/plan.ts";
import { createServerExecutors } from "./resources/server/executor.ts";
import type { Context } from "../types/context.ts";
import type { Plan } from "../types/plan.ts";

export async function createHCloudPlan(context: Context): Promise<Plan> {
  logger.debug("[Plan][HCloud] Creating plan");
  const {
    previousState: { hcloud: hcloudState } = {},
    config: { resources: { hcloud: hcloudConfig } = {} },
    hcloud,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(hcloudState) && isEmpty(hcloudConfig)) {
    return [];
  }

  if (!hcloud) {
    throw new PlanError(
      "HCloud provider is required when using hcloud resources, ensure that providers.hcloud is defined in config",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }

  const { server: serverConfig } = hcloudConfig ?? {};
  const { server: serverState } = hcloudState ?? {};

  if (!isEmpty(serverState) || !isEmpty(serverConfig)) {
    const executors = createServerExecutors(hcloud);
    plan.push(createServerPlan(executors, serverState, serverConfig));
  }

  return (await Promise.all(plan)).flat();
}

export async function createHCloudDestroyPlan(context: Context): Promise<Plan> {
  const {
    previousState: { hcloud: hcloudState } = {},
    hcloud,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(hcloudState)) {
    return [];
  }

  if (!hcloud) {
    throw new PlanError(
      "HCloud provider is required when using hcloud resources, ensure that providers.hcloud is defined in config",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }

  const { server: serverState } = hcloudState ?? {};

  if (!isEmpty(serverState)) {
    const executors = createServerExecutors(hcloud);
    plan.push(createServerDestroyPlan(executors, serverState));
  }

  return (await Promise.all(plan)).flat();
}
