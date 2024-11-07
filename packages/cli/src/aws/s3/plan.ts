import { logger } from "../../logger.ts";
import { mergeProjectTags, toTagsList } from "../../utils/tags.ts";
import type { AWSClient } from "../client/client.ts";
import type { Tags, WithBranch } from "../../types/config.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan, UpdateUnit } from "../../types/plan.ts";
import type { BucketConfig, BucketState, S3Config, S3State } from "./types.ts";
import { assertBranch } from "../../utils/resource.ts";
import { isEqual } from "@es-toolkit/es-toolkit";
import { Type } from "../../types/plan.ts";
import { addDefaultRegion, assertRegion } from "../utils.ts";
import type { WithRegion } from "../types.ts";

export async function createBucket(
  this: AWSClient,
  name: string,
  config: WithBranch<WithRegion<BucketConfig>>,
): Promise<BucketState> {
  assertBranch(config);

  const {
    region,
    tags,
  } = config;

  const start = Date.now();
  await this.createBucket(region, {
    Bucket: name,
  });

  const tagList = toTagsList(tags);
  if (tagList) {
    await this.updateBucketTags(region, name, tagList);
  }
  const end = Date.now();
  logger.debug(`[AWS]: created bucket ${name} in ${end - start}ms`);

  return {
    arn: `arn:aws:s3:::${name}`,
    createdAt: new Date().toISOString(),
    config,
  };
}
export type CreateBucket = typeof createBucket;

export async function deleteBucket(
  this: AWSClient,
  region: string,
  name: string,
): Promise<void> {
  const start = Date.now();
  await this.deleteBucket(region, name);
  const end = Date.now();
  logger.debug(`[AWS]: deleted bucket ${name} in ${end - start}ms`);
}

export type DeleteBucket = typeof deleteBucket;

export async function updateBucket(
  this: AWSClient,
  region: string,
  name: string,
  config: WithBranch<WithRegion<BucketConfig>>,
): Promise<BucketState> {
  const {
    tags,
  } = config;

  const tagList = toTagsList(tags);
  if (tagList) {
    await this.updateBucketTags(region, name, tagList);
  }
  return {
    arn: `arn:aws:s3:::${name}`,
    createdAt: new Date().toISOString(),
    config,
  };
}

export type UpdateBucket = typeof updateBucket;

export const createS3Executors = (aws: AWSClient) => {
  return {
    region: aws.region ?? aws.defaultRegion,
    createBucket: createBucket.bind(aws),
    deleteBucket: deleteBucket.bind(aws),
    updateBucket: updateBucket.bind(aws),
  };
};

export type Executors = ReturnType<typeof createS3Executors>;

function getCurrent(buckets: S3State = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: BucketConfig;
      state: BucketState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(buckets)) {
    previous[`aws.s3.${name}`] = {
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

function getNext(config: S3Config = {}, region: string, tags?: Tags) {
  const next: {
    [path: string]: {
      name: string;
      config: BucketConfig;
    };
  } = {};

  for (const [name, bucket] of Object.entries(config)) {
    const withTags = mergeProjectTags(bucket, tags);
    const withTagsAndRegion = addDefaultRegion(withTags, region);

    next[`aws.s3.${name}`] = {
      name,
      config: withTagsAndRegion,
    };
  }
  return next;
}

export async function createS3Plan(
  {
    region,
    createBucket,
    deleteBucket,
    updateBucket,
  }: Executors,
  tags?: Tags,
  state?: S3State,
  config?: S3Config,
): Promise<Plan> {
  const plan: Plan = [];

  const previous = getCurrent(state);
  const next = getNext(config, region, tags);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { config, name } = next[key];

    assertRegion(config);
    assertBranch(config);

    const createUnit: CreateUnit<BucketConfig, BucketState, CreateBucket> = {
      type: Type.Create,
      executor: createBucket,
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
    const { config: { region } } = state;
    const deleteUnit: DeleteUnit<BucketState, DeleteBucket> = {
      type: Type.Delete,
      executor: deleteBucket,
      args: [region, name],
      path: key,
      state,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextConfig } = next[key];
    const { config: previousConfig, state, name } = previous[key];

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
      if (nextConfig.region !== previousConfig.region) {
        throw new Error(
          "It is not possible to update s3 bucket region, create new and migrate data",
        );
      }

      assertRegion(nextConfig);
      assertBranch(nextConfig);

      const updateUnit: UpdateUnit<
        BucketConfig,
        BucketState,
        UpdateBucket
      > = {
        type: Type.Update,
        executor: updateBucket,
        args: [nextConfig.region, name, nextConfig],
        path: key,
        state,
        config: nextConfig,
        dependsOn: [],
      };
      plan.push(updateUnit);
    }
  }

  return await Promise.resolve(plan);
}

export function createS3DestroyPlan(
  executors: Executors,
  state?: S3State,
) {
  const plan: Plan = [];
  logger.debug("[AWS] Creating destroy buckets plan", {
    state,
  });

  const previous = getCurrent(state);
  for (const key of Object.keys(previous)) {
    const { state, name } = previous[key];
    const { config: { region } } = state;
    const deleteUnit: DeleteUnit<BucketState, DeleteBucket> = {
      type: Type.Delete,
      executor: executors.deleteBucket,
      args: [region, name],
      path: key,
      state: state,
    };
    plan.push(deleteUnit);
  }

  return Promise.resolve(plan);
}
