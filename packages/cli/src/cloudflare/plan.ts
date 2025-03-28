import { PlanError, PlanErrorCode } from "../error.ts";
import { createDNSDestroyPlan, createDNSPlan } from "./resources/dns/record/plan.ts";
import { createDNSExecutors } from "./resources/dns/record/executor.ts";
import { createR2DestroyPlan, createR2Plan } from "./resources/r2/bucket/plan.ts";
import { createR2Executors } from "./resources/r2/bucket/executor.ts";
import { isEmpty } from "../utils/object.ts";
import { createD1DatabaseDestroyPlan, createD1DatabasePlan } from "./resources/d1/database/plan.ts";
import { createD1DatabaseExecutors } from "./resources/d1/database/executor.ts";
import { createR2ObjectsDestroyPlan, createR2ObjectsPlan } from "./resources/r2/object/plan.ts";
import { createObjectExecutors } from "@/generic/resources/s3/object/executor.ts";
import type { Context } from "../types/context.ts";
import type { Plan } from "../types/plan.ts";

export async function createCloudflarePlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      cloudflare: cloudflareState,
    } = {},
    config: {
      resources: {
        cloudflare: cloudflareConfig,
      } = {},
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
    dns: {
      record: dnsRecordConfig,
    } = {},
    r2: {
      bucket: r2BucketsConfig,
      object: r2ObjectsConfig,
    } = {},
    d1: {
      database: d1DatabaseConfig,
    } = {},
  } = cloudflareConfig ?? {};

  const {
    dns: {
      record: dnsRecordState,
    } = {},
    r2: {
      bucket: r2BucketsState,
      object: r2ObjectsState,
    } = {},
    d1: {
      database: d1DatabaseState,
    } = {},
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

  if (!isEmpty(r2BucketsState) || !isEmpty(r2BucketsConfig)) {
    const executors = createR2Executors(cloudflare);
    plan.push(createR2Plan(
      executors,
      r2BucketsState,
      r2BucketsConfig,
    ));
  }

  if (!isEmpty(r2ObjectsState) || !isEmpty(r2ObjectsConfig)) {
    const s3Client = cloudflare.getS3Client();
    if (!s3Client) {
      throw new PlanError(
        "Cloudflare R2 S3 client is required when using R2 objects, configure providers.cloudflare.s3",
        PlanErrorCode.PROVIDER_MISSING,
      );
    }
    const executors = createObjectExecutors(s3Client);
    plan.push(createR2ObjectsPlan(
      executors,
      {},
      r2ObjectsState,
      r2ObjectsConfig,
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
    dns: {
      record: dnsRecordState,
    } = {},
    r2: {
      bucket: r2BucketState,
      object: r2ObjectState,
    } = {},
    d1: {
      database: d1DatabaseState,
    } = {},
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
  if (!isEmpty(r2ObjectState)) {
    const s3Client = cloudflare.getS3Client();
    if (!s3Client) {
      throw new PlanError(
        "Cloudflare R2 S3 client is required when using R2 objects, configure providers.cloudflare.s3",
        PlanErrorCode.PROVIDER_MISSING,
      );
    }
    const executors = createObjectExecutors(s3Client);
    plan.push(createR2ObjectsDestroyPlan(
      executors,
      r2ObjectState,
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
