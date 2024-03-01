import { isEmpty } from "moderndash";
import type { Context } from "../context";
import type { Plan } from "../types/plan";

export const createBucketsPlan = (context: Context): Plan[] => {
  const {
    previousConfig, 
    nextConfig, 
  } = context;

  if (isEmpty(previousConfig?.buckets) && isEmpty(nextConfig.buckets)) {
    return [];
  }

  return [];
};
