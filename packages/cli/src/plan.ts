import { createBucketsPlan } from "./buckets/plan";
import type { Context } from "./context";
import { createDNSPlan } from "./dns/plan";
import type { Plan } from "./types/plan";

export async function createPlan(
  context: Context
): Promise<Plan[]> {
  const plan: Plan[] = [];

  plan.push(...createDNSPlan(context));
  plan.push(...createBucketsPlan(context));

  return Promise.resolve(plan);
}