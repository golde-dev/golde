import { PlanError, PlanErrorCode } from "../error.ts";
import { createDNSDestroyPlan, createDNSPlan } from "./dnsRecord/plan.ts";
import { createR2DestroyPlan, createR2Executors, createR2Plan } from "./r2Bucket/plan.ts";
import type { Context } from "../types/context.ts";
import type { Plan } from "../types/plan.ts";
import { createDNSExecutors } from "./dnsRecord/executor.ts";
import { isEmpty } from "../utils/object.ts";

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
    dnsRecord: dnsRecordConfig,
    r2Bucket: r2BucketConfig,
  } = cloudflareConfig ?? {};

  const {
    dnsRecord: dnsRecordState,
    r2Bucket: r2BucketState,
  } = cloudflareState ?? {};

  if (!isEmpty(dnsRecordState) || !isEmpty(dnsRecordConfig)) {
    const executors = createDNSExecutors(cloudflare);
    plan.push(createDNSPlan(
      executors,
      tags,
      dnsRecordState,
      dnsRecordConfig,
    ));
  }

  if (!isEmpty(r2BucketState) || !isEmpty(r2BucketConfig)) {
    const executors = createR2Executors(cloudflare);
    plan.push(createR2Plan(
      executors,
      r2BucketState,
      r2BucketConfig,
    ));
  }

  return (await Promise.all(plan)).flat();
}

export async function createCloudflareDestroyPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      cloudflare: cloudflareState,
    } = {},
    cloudflare,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(cloudflareState)) {
    return [];
  }

  if (!cloudflare) {
    throw new PlanError(
      "Cloudflare is required when using cloudflare DNS, ensure that providers.cloudflare is defined in config",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }
  const {
    dnsRecord: dnsRecordState,
    r2Bucket: r2BucketState,
  } = cloudflareState ?? {};

  if (!isEmpty(dnsRecordState)) {
    const executors = createDNSExecutors(cloudflare);
    plan.push(createDNSDestroyPlan(
      executors,
      dnsRecordState,
    ));
  }

  if (!isEmpty(r2BucketState)) {
    const executors = createR2Executors(cloudflare);
    plan.push(createR2DestroyPlan(
      executors,
      r2BucketState,
    ));
  }

  return (await Promise.all(plan)).flat();
}
