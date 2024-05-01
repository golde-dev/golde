import { createBucketsPlan } from "./buckets/plan.ts";
import type { Context } from "./context.ts";
import { createDNSPlan } from "./dns/plan.ts";
import { PlanError } from "./error.ts";
import { logger } from "./logger.ts";
import type { Plan } from "./types/plan.ts";

export async function createPlan(
  context: Context,
): Promise<Plan> {
  const plan: Plan = [];

  try {
    plan.push(...await createDNSPlan(context));
    plan.push(...await createBucketsPlan(context));

    logger.info("Plan", plan);
  } catch (error) {
    if (error instanceof PlanError) {
      logger.error(`Failed to plan changes: ${error.message}`);
    } else {
      logger.error("Unknown plan error", error);
    }
    return Deno.exit(1);
  }

  return Promise.resolve(plan);
}
