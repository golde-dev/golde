import type { Context } from "../context.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import type { Plan } from "../types/plan.ts";
import { createCloudflareBucketsPlan } from "./providers/cloudflare.ts";

export const createBucketsPlan = (context: Context): Promise<Plan> => {
  const {
    previousConfig: {
      buckets: prevBucketsConfig,
    } = {},
    previousState: {
      buckets: prevBucketsState,
    } = {},
    nextConfig: {
      buckets: nextBucketsConfig,
    },
    cloudflare,
  } = context;

  const plan: Plan = [];

  if (
    Boolean(prevBucketsConfig?.cloudflare) ||
    Boolean(nextBucketsConfig?.cloudflare)
  ) {
    if (!cloudflare) {
      throw new PlanError(
        "Cloudflare provider is required when using cloudflare buckets",
        PlanErrorCode.PROVIDER_MISSING,
      );
    }
    plan.push(...createCloudflareBucketsPlan(
      cloudflare,
      prevBucketsConfig?.cloudflare,
      prevBucketsState?.cloudflare,
      nextBucketsConfig?.cloudflare,
    ));
  }

  return Promise.resolve(plan);
};
