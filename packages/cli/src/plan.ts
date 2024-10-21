import { createArtifactsPlan } from "./artifacts/plan.ts";
import { createBucketsPlan } from "./buckets/plan.ts";
import type { Context } from "./context.ts";
import { createDNSPlan } from "./dns/plan.ts";
import { PlanError } from "./error.ts";
import { logger } from "./logger.ts";
import type { Plan } from "./types/plan.ts";

function logPlan(plan: Plan) {
  logger.debug("Plan", {
    plan,
  });
}

export async function createPlan(
  context: Context,
): Promise<Plan> {
  try {
    const plan: Plan = (await Promise.all(
      [
        createDNSPlan(context),
        createBucketsPlan(context),
        createArtifactsPlan(context),
      ],
    )).flat();

    logPlan(plan);
    return plan;
  } catch (error) {
    if (error instanceof PlanError) {
      logger.error(`Failed to plan changes: ${error.message}`);
    } else {
      logger.error("Unknown plan error", error);
    }
    return Deno.exit(1);
  }
}
