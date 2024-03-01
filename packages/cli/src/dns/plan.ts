import type { Context } from "../context";
import type { Plan } from "../types/plan";
import { isEmpty } from "moderndash";

export const createDNSPlan = (context: Context): Plan[] => {
  const {
    previousConfig, 
    nextConfig, 
  } = context;

  if (isEmpty(previousConfig?.dns) && isEmpty(nextConfig.dns)) {
    return [];
  }
  return [];
}; 