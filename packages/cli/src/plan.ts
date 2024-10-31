import { logger } from "./logger.ts";
import { createArtifactsPlan } from "./artifacts/plan.ts";
import { createBucketsPlan } from "./buckets/plan.ts";
import { createDNSPlan } from "./dns/plan.ts";
import { PlanError } from "./error.ts";
import { Type } from "./types/plan.ts";
import type { Context } from "./types/context.ts";
import type { ExecutionUnit, Plan } from "./types/plan.ts";
import type { ExecutionGroups } from "./types/plan.ts";

export function sortByPath<T extends ExecutionUnit>(plan: T[]): T[] {
  return plan.toSorted(({ path: pathA }, { path: pathB }) => pathA.localeCompare(pathB));
}

export function hasChanges(plan: Plan): boolean {
  return plan.some((unit) => unit.type !== Type.Noop);
}

export function printPlan(flatPlan: Plan) {
  const plan = Object.groupBy(flatPlan, ({ type }) => type) as ExecutionGroups;

  logger.info("Execution plan");

  if (plan[Type.Noop]) {
    logger.info(`${plan[Type.Noop].length} resources that are already up to date`);
    sortByPath(plan[Type.Noop]).forEach((noop) => {
      if (logger.level === "DEBUG") {
        logger.debug(`    ${noop.path}`, {
          config: noop.config,
          state: noop.state,
        });
      } else {
        logger.info(`   ${noop.path}`);
      }
    });
  }

  if (plan[Type.Create]) {
    logger.info(`${plan[Type.Create].length} resources to create`);
    sortByPath(plan[Type.Create]).forEach((create) => {
      if (logger.level === "DEBUG") {
        logger.debug(`    ${create.path}`, {
          config: create.config,
        });
      } else {
        logger.info(`   ${create.path}`);
      }
    });
  }

  if (plan[Type.Delete]) {
    logger.info(`${plan[Type.Delete].length} resources to delete`);
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
    logger.info(`${plan[Type.Update].length} Resources to delete`);
    sortByPath(plan[Type.Update]).forEach((update) => {
      if (logger.level === "DEBUG") {
        logger.debug(`    ${update.path}`, {
          config: update.config,
          state: update.state,
        });
      } else {
        logger.info(`   ${update.path}`);
      }
    });
  }
}

export async function createPlan(
  context: Context,
): Promise<Plan> {
  try {
    logger.info("Creating plan");
    const plan: Plan = (
      await Promise.all(
        [
          createDNSPlan(context),
          createBucketsPlan(context),
          createArtifactsPlan(context),
        ],
      )
    ).flat();

    logger.info("Successfully created plan");
    return sortByPath(plan);
  } catch (error) {
    if (error instanceof PlanError) {
      logger.error(`Failed to plan changes: ${error.message}`);
    } else if (error instanceof Error) {
      logger.error(`Unknown plan error: ${error.message}`);
    }
    return Deno.exit(1);
  }
}
