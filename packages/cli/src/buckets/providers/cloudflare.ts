import { isEqual } from "moderndash";
import type { CloudflareClient } from "../../clients/cloudflare/client.ts";
import type { DeleteUnit, NoopUnit } from "../../types/plan.ts";
import { type CreateUnit, type Plan, Type } from "../../types/plan.ts";
import { assertBranch } from "../../utils/resource.ts";
import type {
  CloudflareBucket,
  CloudflareBuckets,
  CloudflareBucketsState,
  CloudflareBucketState,
} from "../types.ts";
import { logger } from "../../logger.ts";

export async function createBucket(
  this: CloudflareClient,
  name: string,
  config: CloudflareBucket,
): Promise<CloudflareBucketState> {
  assertBranch(config);

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
  logger.debug(`Cloudflare: created bucket ${name} in ${end - start}ms`);
  return bucket;
}
export type CreateBucket = typeof createBucket;

export async function deleteBucket(this: CloudflareClient, name: string) {
  const start = Date.now();
  await this.deleteBucket(name);
  const end = Date.now();

  logger.debug(`Cloudflare: deleting bucket ${name} in ${end - start}ms`);
}
export type DeleteBucket = typeof deleteBucket;

export const createCloudflareBucketsExecutors = (cloudflare: CloudflareClient) => {
  return {
    createBucket: createBucket.bind(cloudflare),
    deleteBucket: deleteBucket.bind(cloudflare),
  };
};

export type Executors = ReturnType<typeof createCloudflareBucketsExecutors>;

function getCurrent(buckets: CloudflareBucketsState = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: CloudflareBucket;
      state: CloudflareBucketState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(buckets)) {
    previous[`buckets.cloudflare.${name}`] = {
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

function getNext(config: CloudflareBuckets = {}) {
  const next: {
    [path: string]: {
      name: string;
      config: CloudflareBucket;
    };
  } = {};

  for (const [name, bucket] of Object.entries(config)) {
    next[`buckets.cloudflare.${name}`] = {
      name,
      config: bucket,
    };
  }
  return next;
}

export async function createCloudflareBucketsPlan(
  executors: Executors,
  state?: CloudflareBucketsState,
  config?: CloudflareBuckets,
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

    const createUnit: CreateUnit<CloudflareBucket, CloudflareBucketState, CreateBucket> = {
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
    const deleteUnit: DeleteUnit<CloudflareBucketState, DeleteBucket> = {
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
      const noopUnit: NoopUnit<CloudflareBucket, CloudflareBucketState> = {
        type: Type.Noop,
        path: key,
        config: previousConfig,
        state,
      };
      plan.push(noopUnit);
      continue;
    } else {
      throw new Error("It is not possible to update r2 bucket, create new and migrate data");
    }
  }

  return await Promise.resolve(plan);
}
