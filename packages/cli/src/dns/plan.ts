import { isEmpty } from "moderndash";
import type { Context } from "../context.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import type { Plan } from "../types/plan.ts";
import {
  createCloudflareDNSPlan,
  createCloudflareExecutors,
} from "./providers/cloudflare.ts";

export async function createDNSPlan(context: Context): Promise<Plan> {
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

  const plan: Promise<Plan>[] = [];

  if (
    !isEmpty(prevDNSConfig?.cloudflare) || !isEmpty(nextDNSConfig?.cloudflare)
  ) {
    if (!cloudflare) {
      throw new PlanError(
        "Cloudflare provider is required when using cloudflare dns",
        PlanErrorCode.PROVIDER_MISSING,
      );
    }
    const cloudflareDNSExecutors = createCloudflareExecutors(cloudflare);

    plan.push(createCloudflareDNSPlan(
      cloudflareDNSExecutors,
      prevDNSConfig?.cloudflare,
      prevDNSState?.cloudflare,
      nextDNSConfig?.cloudflare,
    ));
  }

  return (await Promise.all(plan)).flat();
}
