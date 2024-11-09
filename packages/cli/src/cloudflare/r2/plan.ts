import { isEqual } from "@es-toolkit/es-toolkit";
import type { CloudflareClient } from "../client/client.ts";
import type { DeleteUnit, NoopUnit } from "../../types/plan.ts";
import { type CreateUnit, type Plan, Type } from "../../types/plan.ts";
import { assertBranch } from "../../utils/resource.ts";
import type { BucketConfig, BucketState, R2Config, R2State } from "./types.ts";
import { logger } from "../../logger.ts";
import type { WithBranch } from "../../types/config.ts";
import { formatDuration } from "../../utils/duration.ts";

export async function createBucket(
  this: CloudflareClient,
  name: string,
  config: WithBranch<BucketConfig>,
): Promise<BucketState> {
  const start = Date.now();
  const bucket = await this.createBucket({
    name,
    locationHint: config.locationHint,
    storageClass: config.storageClass,
  }).then((b) => {
    return {
      location: b.location,
      createdAt: b.creation_date,
      storageClass: b.storage_class,
      config,
    };
  });
  const end = Date.now();
  logger.debug(`[Cloudflare]: created bucket ${name} in ${formatDuration(end - start)}`);
  return bucket;
}
export type CreateBucket = typeof createBucket;

export async function deleteBucket(this: CloudflareClient, name: string) {
  const start = Date.now();
  await this.deleteBucket(name);
  const end = Date.now();

  logger.debug(`[Cloudflare]: deleting bucket ${name} in ${formatDuration(end - start)}`);
}
export type DeleteBucket = typeof deleteBucket;

export const createR2Executors = (cloudflare: CloudflareClient) => {
  return {
    createBucket: createBucket.bind(cloudflare),
    deleteBucket: deleteBucket.bind(cloudflare),
  };
};

export type Executors = ReturnType<typeof createR2Executors>;

function getCurrent(buckets: R2State = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: BucketConfig;
      state: BucketState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(buckets)) {
    previous[`cloudflare.r2.${name}`] = {
      name,
      config,
      state: {
        ...rest,
        config,
      },
    };
  }
  return previous;
}

function getNext(config: R2Config = {}) {
  const next: {
    [path: string]: {
      name: string;
      config: BucketConfig;
    };
  } = {};

  for (const [name, bucket] of Object.entries(config)) {
    next[`cloudflare.r2.${name}`] = {
      name,
      config: bucket,
    };
  }
  return next;
}

export async function createR2Plan(
  executors: Executors,
  state?: R2State,
  config?: R2Config,
): Promise<Plan> {
  logger.debug("[Cloudflare] Creating buckets plan", {
    state,
    config,
  });

  const plan: Plan = [];

  const previous = getCurrent(state);
  const next = getNext(config);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { config, name } = next[key];

    assertBranch(config);
    const createUnit: CreateUnit<BucketConfig, BucketState, CreateBucket> = {
      type: Type.Create,
      executor: executors.createBucket,
      args: [name, config],
      path: key,
      config,
      dependsOn: [],
    };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));
  for (const key of deleting) {
    const { state, name } = previous[key];
    const deleteUnit: DeleteUnit<BucketState, DeleteBucket> = {
      type: Type.Delete,
      executor: executors.deleteBucket,
      args: [name],
      path: key,
      state,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextConfig } = next[key];
    const { config: previousConfig, state } = previous[key];

    const isSameBaseConfig = isEqual(nextConfig, previousConfig);
    if (isSameBaseConfig) {
      const noopUnit: NoopUnit<BucketConfig, BucketState> = {
        type: Type.Noop,
        path: key,
        config: previousConfig,
        state,
      };
      plan.push(noopUnit);
    } else {
      throw new Error("It is not possible to update r2 bucket, create new and migrate data");
    }
  }

  return await Promise.resolve(plan);
}

export function createR2DestroyPlan(
  executors: Executors,
  state?: R2State,
) {
  const plan: Plan = [];
  logger.debug("[Cloudflare] Creating buckets plan", {
    state,
  });

  const previous = getCurrent(state);
  for (const key of Object.keys(previous)) {
    const { state, name } = previous[key];
    const deleteUnit: DeleteUnit<BucketState, DeleteBucket> = {
      type: Type.Delete,
      executor: executors.deleteBucket,
      args: [name],
      path: key,
      state: state,
    };
    plan.push(deleteUnit);
  }

  return Promise.resolve(plan);
}
