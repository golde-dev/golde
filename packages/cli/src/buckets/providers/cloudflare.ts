import type { CloudflareProvider } from "../../providers/cloudflare.ts";
import type { Plan } from "../../types/plan.ts";
import type { CloudflareBuckets, CloudflareBucketsState } from "../types.ts";

export const createCloudflareBucketsPlan = (
  cloudflare: CloudflareProvider,
  prevConfig?: CloudflareBuckets,
  prevState?: CloudflareBucketsState,
  nextConfig?: CloudflareBuckets,
): Plan => {
  console.log({
    cloudflare,
    prevConfig,
    prevState,
    nextConfig,
  });
  return [];
};
