import { createBucketsPlan } from "./buckets/plan";
import type { Context } from "./context";
import { createDNSPlan } from "./dns/plan";
import { PlanError } from "./error";
import logger from "./logger";
import type { Plan } from "./types/plan";

export async function createPlan(
  context: Context
): Promise<Plan> {
  const plan: Plan = [];      

  try {
    plan.push(...await createDNSPlan(context));
    plan.push(...await createBucketsPlan(context));

    logger.info("Plan", plan);
  }
  catch (error) {
    if (error instanceof PlanError) {
      logger.error(`Failed to plan changes: ${error.message}`);
    }
    else {
      logger.error("Unknown plan error", error);
    }
    return process.exit(1);
  }

  return Promise.resolve(plan);
}