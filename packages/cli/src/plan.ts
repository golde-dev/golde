import { createArtifactsPlan } from "./artifacts/plan.ts";
import { createBucketsPlan } from "./buckets/plan.ts";
import { createDNSPlan } from "./dns/plan.ts";
import { PlanError } from "./error.ts";
import { logger } from "./logger.ts";
import type { Context } from "./types/context.ts";
import type { ExecutionUnit, Plan } from "./types/plan.ts";
import type { ExecutionGroups } from "./types/plan.ts";
import { Type } from "./types/plan.ts";

function sortByPath<T extends ExecutionUnit>(plan: T[]): T[] {
  return plan.toSorted(({ path: pathA }, { path: pathB }) => pathA.localeCompare(pathB));
}

export function printPlan(flatPlan: Plan) {
  const plan = Object.groupBy(flatPlan, ({ type }) => type) as ExecutionGroups;

  if (flatPlan.length === 0) {
    logger.info("No resources to update");
    return;
  }

  logger.info("Execution plan");

  if (plan[Type.Noop]) {
    logger.info(`${plan[Type.Noop].length} resources that are already up to date`);
    sortByPath(plan[Type.Noop]).forEach((noop) => {
      logger.info(`   ${noop.path}`);
      logger.debug(`  `, {
        config: noop.config,
        state: noop.state,
      });
    });
  }

  if (plan[Type.Create]) {
    logger.info(`${plan[Type.Create].length} resources to create`);
    sortByPath(plan[Type.Create]).forEach((create) => {
      logger.info(`   ${create.path}`);
      logger.debug(`  `, {
        config: create.config,
      });
    });
  }

  if (plan[Type.Delete]) {
    logger.info(`${plan[Type.Delete].length} resources to delete`);
    sortByPath(plan[Type.Delete]).forEach((deleted) => {
      logger.info(`   ${deleted.path}`);
      logger.debug(`  `, {
        state: deleted.state,
      });
    });
  }

  if (plan[Type.Update]) {
    logger.info(`${plan[Type.Update].length} Resources to delete`);
    sortByPath(plan[Type.Update]).forEach((update) => {
      logger.info(`   ${update.path}`);
      logger.debug(`  `, {
        config: update.config,
        state: update.state,
      });
    });
  }
}

export async function createPlan(
  context: Context,
): Promise<Plan> {
  try {
    logger.info("Creating plan");
    const plan: Plan[] = await Promise.all(
      [
        createDNSPlan(context),
        createBucketsPlan(context),
        createArtifactsPlan(context),
      ],
    );
    logger.info("Plan created");

    return plan
      .flat()
      .toSorted(({ path: pathA }, { path: pathB }) => pathA.localeCompare(pathB));
  } catch (error) {
    if (error instanceof PlanError) {
      logger.error(`Failed to plan changes: ${error.message}`);
    } else {
      logger.error("Unknown plan error", error);
    }
    return Deno.exit(1);
  }
}
