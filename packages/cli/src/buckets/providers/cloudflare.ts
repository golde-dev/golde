import type { CloudflareProvider } from "../../providers/cloudflare";
import type { Plan } from "../../types/plan";
import type { CloudflareBuckets, CloudflareBucketsState } from "../types";


export const createCloudflareBucketsPlan = (
  cloudflare: CloudflareProvider, 
  prevConfig?: CloudflareBuckets, 
  prevState?: CloudflareBucketsState,
  nextConfig?: CloudflareBuckets
): Plan => {

  
  console.log({
    cloudflare, 
    prevConfig, 
    prevState, 
    nextConfig,
  });
  return [];
};