import type { CloudflareClient } from "../../clients/cloudflare.ts";
import type { Plan } from "../../types/plan.ts";
import type { CloudflareBuckets, CloudflareBucketsState } from "../types.ts";

export const createCloudflareBucketsPlan = (
  cloudflare: CloudflareClient,
  prevConfig?: CloudflareBuckets,
  prevState?: CloudflareBucketsState,
  nextConfig?: CloudflareBuckets,
): Promise<Plan> => {
  console.log({
    cloudflare,
    prevConfig,
    prevState,
    nextConfig,
  });
  return Promise.resolve([]);
};
