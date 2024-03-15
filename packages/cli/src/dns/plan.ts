import type { Context } from "../context";
import { PlanError, PlanErrorCode } from "../error";
import type { Plan } from "../types/plan";
import { createCloudflareDNSPlan } from "./providers/cloudflare";

export const createDNSPlan = async(context: Context): Promise<Plan> => {
  const {
    previousConfig: {
      dns: prevDNSConfig,
    } = {}, 
    previousState: {
      dns: prevDNSState,
    } = {},
    nextConfig: {
      dns: nextDNSConfig,
    },
    cloudflare,
  } = context;

  const plan: Plan = [];

  if (Boolean(prevDNSConfig?.cloudflare) || Boolean(nextDNSConfig?.cloudflare)) {
    if (!cloudflare) {
      throw new PlanError("Cloudflare provider is required when using cloudflare dns", PlanErrorCode.PROVIDER_MISSING);
    }

    plan.push(...createCloudflareDNSPlan(
      cloudflare, 
      prevDNSConfig?.cloudflare,
      prevDNSState?.cloudflare,
      nextDNSConfig?.cloudflare
    ));
  }
  
  return Promise.resolve(plan);
}; 