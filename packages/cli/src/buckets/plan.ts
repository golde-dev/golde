import { isEmpty } from "moderndash";
import type { Context } from "../context.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import type { Plan } from "../types/plan.ts";
import {
  createCloudflareBucketsExecutors,
  createCloudflareBucketsPlan,
} from "./providers/cloudflare.ts";

export async function createBucketsPlan(context: Context): Promise<Plan> {
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
    git,
  } = context;

  const promises: Promise<Plan>[] = [];

  if (
    !isEmpty(prevBucketsConfig?.cloudflare) ||
    !isEmpty(nextBucketsConfig?.cloudflare)
  ) {
    if (!cloudflare) {
      throw new PlanError(
        "Cloudflare client is required when using cloudflare r2, ensure that providers.cloudflare is defined in config",
        PlanErrorCode.PROVIDER_MISSING,
      );
    }
    const executors = createCloudflareBucketsExecutors(cloudflare);
    promises.push(createCloudflareBucketsPlan(
      executors,
      git,
      prevBucketsConfig?.cloudflare,
      prevBucketsState?.cloudflare,
      nextBucketsConfig?.cloudflare,
    ));
  }

  return (await Promise.all(promises)).flat();
}
