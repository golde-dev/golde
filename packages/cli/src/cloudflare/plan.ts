import { isEmpty } from "moderndash";
import { PlanError, PlanErrorCode } from "../error.ts";
import type { Plan } from "../types/plan.ts";
import { createCloudflareDNSPlan, createDNSExecutors } from "./dns/plan.ts";
import type { Context } from "../types/context.ts";
import { createR2BucketsExecutors, createR2BucketsPlan } from "./r2/plan.ts";

export async function createCloudflarePlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      cloudflare: cloudflareState,
    } = {},
    config: {
      cloudflare: cloudflareConfig,
    },
    cloudflare,
    tags,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(cloudflareState) && isEmpty(cloudflareConfig)) {
    return [];
  }

  if (!cloudflare) {
    throw new PlanError(
      "Cloudflare is required when using cloudflare DNS, ensure that providers.cloudflare is defined in config",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }

  const {
    dns: dnsConfig,
    r2: r2Config,
  } = cloudflareConfig ?? {};

  const {
    dns: dnsState,
    r2: r2State,
  } = cloudflareState ?? {};

  if (!isEmpty(dnsState) || !isEmpty(dnsConfig)) {
    const executors = createDNSExecutors(cloudflare);
    plan.push(createCloudflareDNSPlan(
      executors,
      tags,
      dnsState,
      dnsConfig,
    ));
  }

  if (!isEmpty(r2State) || !isEmpty(r2Config)) {
    const executors = createR2BucketsExecutors(cloudflare);
    plan.push(createR2BucketsPlan(
      executors,
      r2State,
      r2Config,
    ));
  }

  return (await Promise.all(plan)).flat();
}
