import { PlanError, PlanErrorCode } from "../error.ts";
import { createDNSDestroyPlan, createDNSPlan } from "./resources/dnsRecord/plan.ts";
import { createDNSExecutors } from "./resources/dnsRecord/executor.ts";
import { createR2DestroyPlan, createR2Plan } from "./resources/r2/bucket/plan.ts";
import { createR2Executors } from "./resources/r2/bucket/executor.ts";
import { isEmpty } from "../utils/object.ts";
import { createD1DatabaseDestroyPlan, createD1DatabasePlan } from "./resources/d1Database/plan.ts";
import { createD1DatabaseExecutors } from "./resources/d1Database/executor.ts";
import type { Context } from "../types/context.ts";
import type { Plan } from "../types/plan.ts";

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
    r2: {
      bucket: r2BucketConfig,
    } = {},
    d1Database: d1DatabaseConfig,
  } = cloudflareConfig ?? {};

  const {
    dnsRecord: dnsRecordState,
    r2: {
      bucket: r2BucketState,
    } = {},
    d1Database: d1DatabaseState,
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

  if (!isEmpty(d1DatabaseState) || !isEmpty(d1DatabaseConfig)) {
    const executors = createD1DatabaseExecutors(cloudflare);
    plan.push(createD1DatabasePlan(
      executors,
      d1DatabaseState,
      d1DatabaseConfig,
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
    r2: {
      bucket: r2BucketState,
    } = {},
    d1Database: d1DatabaseState,
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
  if (!isEmpty(d1DatabaseState)) {
    const executors = createD1DatabaseExecutors(cloudflare);
    plan.push(createD1DatabaseDestroyPlan(
      executors,
      d1DatabaseState,
    ));
  }

  return (await Promise.all(plan)).flat();
}
