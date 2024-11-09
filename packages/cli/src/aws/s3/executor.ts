import { PlanError, PlanErrorCode } from "../../error.ts";
import { logger } from "../../logger.ts";
import type { WithBranch } from "../../types/config.ts";
import { formatDuration } from "../../utils/duration.ts";
import { assertBranch } from "../../utils/resource.ts";
import { toTagsList } from "../../utils/tags.ts";
import type { AWSClient } from "../client/client.ts";
import type { WithRegion } from "../types.ts";
import type { BucketConfig, BucketState } from "./types.ts";

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
  logger.debug(`[AWS] Created bucket ${name} in ${formatDuration(end - start)}`);

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
  logger.debug(`[AWS] Deleted bucket ${name} in ${formatDuration(end - start)}`);
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

export async function assertBucketExist(this: AWSClient, name: string, region?: string) {
  const start = performance.now();
  const exists = await this.checkBucketExists(name, region);
  const end = performance.now();
  logger.debug(`[AWS] Checked bucket ${name} exists in ${formatDuration(end - start)}`);
  if (!exists) {
    throw new PlanError(`Bucket ${name} does not exist`, PlanErrorCode.RESOURCE_NOT_FOUND);
  }
}

export async function assertBucketNameAvailable(this: AWSClient, name: string, region?: string) {
  const start = performance.now();
  const available = await this.checkBucketNameAvailable(name, region);
  const end = performance.now();
  logger.debug(`[AWS] Checked bucket ${name} exists in ${formatDuration(end - start)}`);
  if (!available) {
    throw new PlanError(`Cannot use bucket name ${name}`, PlanErrorCode.RESOURCE_CONFLICT);
  }
}

export async function assertCreatePermission(this: AWSClient, name: string, _region?: string) {
  const start = performance.now();
  const [allowed, reason] = await this.checkPermission(
    ["s3:CreateBucket"],
    [`arn:aws:s3:::${name}`],
    this.region,
  );
  const end = performance.now();
  logger.debug(`[AWS] Checked permission for bucket ${name} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(`[AWS] Create permission denied for bucket ${name}`, reason);
    throw new PlanError(`Cannot create bucket ${name}`, PlanErrorCode.PERMISSION_DENIED);
  }
}
export async function assertDeletePermission(this: AWSClient, name: string, _region?: string) {
  const start = performance.now();
  const allowed = await this.checkPermission(
    ["s3:DeleteBucket"],
    [`arn:aws:s3:::${name}`],
    this.region,
  );
  const end = performance.now();
  logger.debug(`[AWS] Checked permission for bucket ${name} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(`[AWS] Delete permission denied for bucket ${name}`);
    throw new PlanError(`Cannot delete bucket ${name}`, PlanErrorCode.PERMISSION_DENIED);
  }
}
export async function assertUpdatePermission(this: AWSClient, name: string, _region?: string) {
  const start = performance.now();
  const allowed = await this.checkPermission(
    ["s3:PutBucketTagging"],
    [`arn:aws:s3:::${name}`],
    this.region,
  );
  const end = performance.now();
  logger.debug(`[AWS] Checked permission for bucket ${name} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(`[AWS] Update tags permission denied for bucket ${name}`);
    throw new PlanError(`Cannot update bucket ${name}`, PlanErrorCode.PERMISSION_DENIED);
  }
}

export function getDefaultRegion(this: AWSClient) {
  return this.region ?? this.defaultRegion;
}

export const createS3Executors = (aws: AWSClient) => {
  return {
    getDefaultRegion: getDefaultRegion.bind(aws),

    createBucket: createBucket.bind(aws),
    deleteBucket: deleteBucket.bind(aws),
    updateBucket: updateBucket.bind(aws),

    assertCreatePermission: assertCreatePermission.bind(aws),
    assertDeletePermission: assertDeletePermission.bind(aws),
    assertUpdatePermission: assertUpdatePermission.bind(aws),
    assertBucketExist: assertBucketExist.bind(aws),
    assertBucketNameAvailable: assertBucketNameAvailable.bind(aws),
  };
};

export type Executors = ReturnType<typeof createS3Executors>;
