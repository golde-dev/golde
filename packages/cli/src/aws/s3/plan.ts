import { logger } from "../../logger.ts";
import { toTagsList } from "../../utils/tags.ts";
import type { AWSClient } from "../client/client.ts";
import type { Tags } from "../../types/config.ts";
import type { Plan } from "../../types/plan.ts";
import type { S3BucketConfig, S3BucketState, S3State } from "./types.ts";
import { assertBranch } from "../../utils/resource.ts";

export async function createBucket(
  this: AWSClient,
  name: string,
  config: S3BucketConfig,
): Promise<S3BucketState> {
  assertBranch(config);

  const {
    region = this.region ?? this.defaultRegion,
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
    region,
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
  config: S3BucketConfig,
): Promise<S3BucketState> {
  assertBranch(config);
  const {
    tags,
  } = config;

  const tagList = toTagsList(tags);
  if (tagList) {
    await this.updateBucketTags(region, name, tagList);
  }
  return {
    arn: `arn:aws:s3:::${name}`,
    region,
    createdAt: new Date().toISOString(),
    config,
  };
}

export const createS3Executors = (aws: AWSClient) => {
  return {
    createBucket: createBucket.bind(aws),
    deleteBucket: deleteBucket.bind(aws),
    updateBucket: updateBucket.bind(aws),
  };
};

export type AWSExecutors = ReturnType<typeof createS3Executors>;

export async function createS3Plan(
  _executors: AWSExecutors,
  _tags?: Tags,
  _state?: S3State,
  _config?: S3BucketConfig,
): Promise<Plan> {
  return await Promise.resolve([]);
}

export async function createS3DestroyPlan(
  _executors: AWSExecutors,
  _state?: S3State,
) {
  return await Promise.resolve([]);
}
