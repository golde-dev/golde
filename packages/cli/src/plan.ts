import { logger } from "./logger.ts";
import { exit } from "node:process";
import { createCloudflareDestroyPlan, createCloudflarePlan } from "./cloudflare/plan.ts";
import { createAWSDestroyPlan, createAWSPlan } from "./aws/plan.ts";
import { createGithubDestroyPlan, createGithubPlan } from "./github/plan.ts";
import { createGoldeDestroyPlan, createGoldePlan } from "@/golde/plan.ts";
import { PlanError } from "./error.ts";
import { Type } from "./types/plan.ts";
import { formatDuration } from "./utils/duration.ts";
import type { Context } from "./types/context.ts";
import type { ExecutionUnit, Plan } from "./types/plan.ts";
import type { UnitGroups } from "./types/plan.ts";

export function sortByPath<T extends { path: string }>(plan: T[]): T[] {
  return plan.toSorted(({ path: pathA }, { path: pathB }) => pathA.localeCompare(pathB));
}

export function hasChanges(plan: Plan): boolean {
  return plan.some((unit) => unit.type !== Type.Noop);
}

export function printPlan(flatPlan: Plan) {
  const plan = Object.groupBy(flatPlan, ({ type }) => type) as UnitGroups;

  logger.info("[Plan] Execution plan");

  if (plan[Type.Noop]?.length) {
    logger.info(`[Plan] ${plan[Type.Noop].length} resources that are already up to date`);
    sortByPath(plan[Type.Noop]).forEach((noop) => {
      if (logger.level === "DEBUG") {
        logger.debug({
          config: noop.config,
          state: noop.state,
        }, `${noop.path}`);
      } else {
        logger.info(`   ${noop.path}`);
      }
    });
  }

  if (plan[Type.Create]?.length) {
    logger.info(`[Plan] ${plan[Type.Create].length} resources to create`);
    sortByPath(plan[Type.Create]).forEach((create) => {
      if (logger.level === "DEBUG") {
        logger.debug({
          config: create.config,
          dependsOn: create.dependsOn.map(({ resourcePath }) => resourcePath),
        }, `    ${create.path}`);
      } else {
        logger.info(`   ${create.path}`);
      }
    });
  }

  if (plan[Type.CreateVersion]?.length) {
    logger.info(`[Plan] ${plan[Type.CreateVersion].length} resources versions to create`);
    sortByPath(plan[Type.CreateVersion]).forEach((create) => {
      if (logger.level === "DEBUG") {
        logger.debug({
          version: create.version,
          config: create.config,
          dependsOn: create.dependsOn.map(({ resourcePath }) => resourcePath),
        }, `${create.path}`);
      } else {
        logger.info(`   ${create.path}`);
        logger.info(`   version::${create.version}`);
      }
    });
  }

  if (plan[Type.Delete]?.length) {
    logger.info(`[Plan] ${plan[Type.Delete].length} resources to delete`);
    sortByPath(plan[Type.Delete]).forEach((deleted) => {
      if (logger.level === "DEBUG") {
        logger.debug({
          state: deleted.state,
        }, `${deleted.path}`);
      } else {
        logger.info(`   ${deleted.path}`);
      }
    });
  }

  if (plan[Type.DeleteVersion]?.length) {
    logger.info(`[Plan] ${plan[Type.DeleteVersion].length} resources versions to delete`);
    sortByPath(plan[Type.DeleteVersion]).forEach((deleted) => {
      if (logger.level === "DEBUG") {
        logger.debug({
          version: deleted.version,
          state: deleted.state,
        }, `${deleted.path}`);
      } else {
        logger.info(`   ${deleted.path}`);
        logger.info(`   version::${deleted.version}`);
      }
    });
  }

  if (plan[Type.Update]?.length) {
    logger.info(`[Plan] ${plan[Type.Update].length} Resources to update`);
    sortByPath(plan[Type.Update]).forEach((update) => {
      if (logger.level === "DEBUG") {
        logger.debug({
          config: update.config,
          state: update.state,
          dependsOn: update.dependsOn.map(({ resourcePath }) => resourcePath),
        }, `    ${update.path}`);
      } else {
        logger.info(`   ${update.path}`);
      }
    });
  }

  if (plan[Type.UpdateVersion]?.length) {
    logger.info(`[Plan] ${plan[Type.UpdateVersion].length} Resources version to update`);
    sortByPath(plan[Type.UpdateVersion]).forEach((update) => {
      if (logger.level === "DEBUG") {
        logger.debug({
          version: update.version,
          config: update.config,
          state: update.state,
          dependsOn: update.dependsOn.map(({ resourcePath }) => resourcePath),
        }, `${update.path}`);
      } else {
        logger.info(`   ${update.path}`);
        logger.info(`   version::${update.version}`);
      }
    });
  }

  if (plan[Type.ChangeVersion]?.length) {
    logger.info(`[Plan] ${plan[Type.ChangeVersion].length} resources versions to change`);
    sortByPath(plan[Type.ChangeVersion]).forEach((update) => {
      if (logger.level === "DEBUG") {
        logger.debug({
          version: update.version,
          config: update.config,
          previousVersion: update.prevVersion,
          newVersion: update.version,
          dependsOn: update.dependsOn.map(({ resourcePath }) => resourcePath),
        }, `${update.path}`);
      } else {
        logger.info(`   ${update.path}`);
        logger.info(`   version::${update.version}`);
      }
    });
  }
}

export function filterExecutionUnits(plan: Plan): ExecutionUnit[] {
  return plan.filter((unit) => unit.type !== Type.Noop);
}

export async function createPlan(
  context: Context,
): Promise<Plan> {
  try {
    logger.debug("[Plan] Creating plan");
    const start = performance.now();
    const initialPlan: Plan = (
      await Promise.all(
        [
          createAWSPlan(context),
          createCloudflarePlan(context),
          createGithubPlan(context),
          createGoldePlan(context),
        ],
      )
    ).flat();
    const sortedUnits = sortByPath(initialPlan);
    const end = performance.now();

    if (!hasChanges(initialPlan)) {
      logger.info(`[Plan] No changes detected in ${formatDuration(end - start)}`);
      exit(0);
    }

    logger.debug(`[Plan] Created plan in ${formatDuration(end - start)}`);

    return sortedUnits;
  } catch (error) {
    if (error instanceof PlanError) {
      logger.error(`[Plan] Failed to plan changes: ${error.message}`);
    } else if (error instanceof Error) {
      logger.error(`[Plan] Unknown plan error: ${error.message}`);
    }
    return exit(1);
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
          createGithubDestroyPlan(context),
          createGoldeDestroyPlan(context),
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
    return exit(1);
  }
}

export function validatePlan(
  plan: Plan,
): Plan {
  return plan;
}
