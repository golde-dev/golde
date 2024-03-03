import type { Context } from "../context";
import { PlanError, PlanErrorCode } from "../error";
import type { Plan } from "../types/plan";

export const createBucketsPlan = async(context: Context): Promise<Plan[]> => {
  const {
    previousConfig: {
      buckets: prevBucketsConfig,
    } = {}, 
    nextConfig: {
      buckets: nextBucketsConfig,
    }, 
    cloudflare,
  } = context;

  const plan: Plan[] = [];

  if (Boolean(prevBucketsConfig?.cloudflare) || Boolean(nextBucketsConfig?.cloudflare)) {
    if (!cloudflare) {
      throw new PlanError("Cloudflare provider is required when using cloudflare buckets", PlanErrorCode.PROVIDER_MISSING);
    }
  }

  return Promise.resolve(plan);
};
