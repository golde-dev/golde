import { isEmpty } from "moderndash";
import type { Context } from "../context.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import type { Plan } from "../types/plan.ts";
import { createCloudflareDNSPlan, createCloudflareExecutors } from "./providers/cloudflare.ts";

export async function createDNSPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      dns: {
        cloudflare: cloudflareState,
      } = {},
    } = {},
    nextConfig: {
      dns: {
        cloudflare: cloudflareConfig,
      } = {},
    },
    cloudflare,
    tags,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (!isEmpty(cloudflareState) || !isEmpty(cloudflareConfig)) {
    if (!cloudflare) {
      throw new PlanError(
        "Cloudflare is required when using cloudflare DNS, ensure that providers.cloudflare is defined in config",
        PlanErrorCode.PROVIDER_MISSING,
      );
    }
    const cloudflareDNSExecutors = createCloudflareExecutors(cloudflare);

    plan.push(createCloudflareDNSPlan(
      cloudflareDNSExecutors,
      tags,
      cloudflareState,
      cloudflareConfig,
    ));
  }

  return (await Promise.all(plan)).flat();
}
