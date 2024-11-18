import { logger } from "./logger.ts";
import { createCloudflareDestroyPlan, createCloudflarePlan } from "./cloudflare/plan.ts";
import { createAWSDestroyPlan, createAWSPlan } from "./aws/plan.ts";
import { createDockerDestroyPlan, createDockerPlan } from "./docker/plan.ts";
import { PlanError } from "./error.ts";
import { Type } from "./types/plan.ts";
import { formatDuration } from "./utils/duration.ts";
import type { Context } from "./types/context.ts";
import type { ExecutionUnit, Plan } from "./types/plan.ts";
import type { ExecutionGroups } from "./types/plan.ts";
import { noop } from "@es-toolkit/es-toolkit";

export function sortByPath<T extends ExecutionUnit>(plan: T[]): T[] {
  return plan.toSorted(({ path: pathA }, { path: pathB }) => pathA.localeCompare(pathB));
}

export function hasChanges(plan: Plan): boolean {
  return plan.some((unit) => unit.type !== Type.Noop);
}

export function printPlan(flatPlan: Plan) {
  const plan = Object.groupBy(flatPlan, ({ type }) => type) as ExecutionGroups;

  logger.info("[Plan] Execution plan");

  if (plan[Type.Noop]) {
    logger.info(`[Plan] ${plan[Type.Noop].length} resources that are already up to date`);
    sortByPath(plan[Type.Noop]).forEach((noop) => {
      if (logger.level === "DEBUG") {
        logger.debug(`${noop.path}`, {
          config: noop.config,
          state: noop.state,
        });
      } else {
        logger.info(`   ${noop.path}`);
      }
    });
  }

  if (plan[Type.Create]) {
    logger.info(`[Plan] ${plan[Type.Create].length} resources to create`);
    sortByPath(plan[Type.Create]).forEach((create) => {
      if (logger.level === "DEBUG") {
        logger.debug(`    ${create.path}`, {
          config: create.config,
          dependsOn: create.dependsOn,
        });
      } else {
        logger.info(`   ${create.path}`);
      }
    });
  }

  if (plan[Type.Delete]) {
    logger.info(`[Plan] ${plan[Type.Delete].length} resources to delete`);
    sortByPath(plan[Type.Delete]).forEach((deleted) => {
      if (logger.level === "DEBUG") {
        logger.debug(`    ${deleted.path}`, {
          state: deleted.state,
        });
      } else {
        logger.info(`   ${deleted.path}`);
      }
    });
  }

  if (plan[Type.Update]) {
    logger.info(`[Plan] ${plan[Type.Update].length} Resources to update`);
    sortByPath(plan[Type.Update]).forEach((update) => {
      if (logger.level === "DEBUG") {
        logger.debug(`    ${update.path}`, {
          config: update.config,
          state: update.state,
          dependsOn: update.dependsOn,
        });
      } else {
        logger.info(`   ${update.path}`);
      }
    });
  }
}

export async function createPlan(
  context: Context,
  print = false,
): Promise<Plan> {
  try {
    logger.debug("[Plan] Creating plan");
    const start = performance.now();
    const plan: Plan = (
      await Promise.all(
        [
          createAWSPlan(context),
          createCloudflarePlan(context),
          createDockerPlan(context),
        ],
      )
    ).flat();
    const end = performance.now();

    if (!hasChanges(plan)) {
      logger.info(`[Plan] No changes detected in ${formatDuration(end - start)}`);
      Deno.exit(0);
    }

    if (print) {
      logger.info(`[Plan] Created plan in ${formatDuration(end - start)}`);
      printPlan(plan);
    } else {
      logger.debug(`[Plan] Created plan in ${formatDuration(end - start)}`);
    }
    return sortByPath(plan);
  } catch (error) {
    if (error instanceof PlanError) {
      logger.error(`[Plan] Failed to plan changes: ${error.message}`);
    } else if (error instanceof Error) {
      logger.error(`[Plan] Unknown plan error: ${error.message}`);
    }
    return Deno.exit(1);
  }
}

export async function createDestroyPlan(context: Context): Promise<Plan> {
  try {
    logger.debug("[Plan] Creating destroy plan");
    const plan: Plan = (
      await Promise.all(
        [
          createAWSDestroyPlan(context),
          createCloudflareDestroyPlan(context),
          createDockerDestroyPlan(context),
        ],
      )
    ).flat();

    logger.debug("[Plan] Created destroy plan");
    return sortByPath(plan);
  } catch (error) {
    if (error instanceof PlanError) {
      logger.error(`[Plan] Failed to plan changes: ${error.message}`);
    } else if (error instanceof Error) {
      logger.error(`[Plan] Unknown plan error: ${error.message}`);
    }
    return Deno.exit(1);
  }
}
