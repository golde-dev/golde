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
    previousState: {
      buckets: {
        cloudflare: cloudflareState,
      } = {},
    } = {},
    nextConfig: {
      buckets: {
        cloudflare: cloudflareConfig,
      } = {},
    } = {},
    cloudflare,
    git,
  } = context;

  const promises: Promise<Plan>[] = [];

  if (
    !isEmpty(cloudflareState) ||
    !isEmpty(cloudflareConfig)
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
      cloudflareState,
      cloudflareConfig,
    ));
  }

  return (await Promise.all(promises)).flat();
}
