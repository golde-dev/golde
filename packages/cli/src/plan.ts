import { createArtifactsPlan } from "./artifacts/plan.ts";
import { createBucketsPlan } from "./buckets/plan.ts";
import { createDNSPlan } from "./dns/plan.ts";
import { PlanError } from "./error.ts";
import { logger } from "./logger.ts";
import type { Context } from "./types/context.ts";
import type { Plan } from "./types/plan.ts";
import type { ExecutionGroups } from "./types/plan.ts";
import { Type } from "./types/plan.ts";

function sortByPath(plan: Plan) {
  return plan.toSorted(({ path: pathA }, { path: pathB }) => pathA.localeCompare(pathB));
}

export function printPlan(flatPlan: Plan) {
  const plan = Object.groupBy(flatPlan, ({ type }) => type) as ExecutionGroups;

  logger.info("Execution plan");

  if (plan[Type.Noop]) {
    logger.debug("Noop", {
      count: plan[Type.Noop].length,
    });
    sortByPath(plan[Type.Noop]).forEach((noop) => {
      logger.debug("Noop", {
        noop,
      });
    });
  }

  if (plan[Type.Create]) {
    logger.info("Create", {
      count: plan[Type.Create].length,
    });
    sortByPath(plan[Type.Create]).forEach((create) => {
      logger.info("Create", {
        create,
      });
    });
  }

  if (plan[Type.Delete]) {
    logger.info("Delete", {
      count: plan[Type.Delete].length,
    });
    sortByPath(plan[Type.Delete]).forEach((deleted) => {
      logger.info("Delete", {
        deleted,
      });
    });
  }

  if (plan[Type.Update]) {
    logger.info("Update", {
      count: plan[Type.Update].length,
    });
    sortByPath(plan[Type.Update]).forEach((update) => {
      logger.info("Update", {
        update,
      });
    });
  }
}

export async function createPlan(
  context: Context,
): Promise<Plan> {
  try {
    const plan: Plan[] = await Promise.all(
      [
        createDNSPlan(context),
        createBucketsPlan(context),
        createArtifactsPlan(context),
      ],
    );

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
