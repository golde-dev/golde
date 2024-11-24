import { isEqual } from "@es-toolkit/es-toolkit";
import { PlanError, PlanErrorCode } from "../../../error.ts";
import { logger } from "../../../logger.ts";
import type { WithBranch } from "../../../types/config.ts";
import { formatDuration } from "../../../utils/duration.ts";
import { assertBranch } from "../../../utils/resource.ts";
import { toTagsList } from "../../../utils/tags.ts";
import { nowStringDate } from "../../../utils/date.ts";
import type { AWSClient } from "../../client/client.ts";
import type { WithRegion } from "../../types.ts";
import type { BucketConfig, BucketState } from "./types.ts";
import type { ResourceDependency } from "../../../types/dependencies.ts";

function s3BucketArn(name: string) {
  return `arn:aws:s3:::${name}`;
}

export async function getBody(config: WithBranch<BucketConfig>) {
}

export async function createBucket(
  this: AWSClient,
  name: string,
  config: WithBranch<WithRegion<BucketConfig>>,
  dependsOn: ResourceDependency[],
): Promise<BucketState> {
  assertBranch(config);

  const {
    region,
    tags,
  } = config;

  const start = performance.now();
  await this.createS3Bucket(region, {
    Bucket: name,
  });

  const tagList = toTagsList(tags);
  if (tagList) {
    await this.updateS3BucketTags(region, name, tagList);
  }
  const end = performance.now();
  logger.debug(`[AWS] Created bucket ${name} in ${formatDuration(end - start)}`);

  const arn = s3BucketArn(name);
  const createdAt = nowStringDate();
  return {
    arn,
    createdAt,
    dependsOn,
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
  logger.debug(`[AWS] Deleted S3 bucket ${name} in ${formatDuration(end - start)}`);
}

export type DeleteBucket = typeof deleteBucket;

export async function updateBucket(
  this: AWSClient,
  region: string,
  name: string,
  config: WithBranch<WithRegion<BucketConfig>>,
  state: BucketState,
  dependsOn: ResourceDependency[],
): Promise<BucketState> {
  const {
    tags,
  } = config;
  const {
    arn,
    createdAt,
    config: {
      tags: previousTags,
    },
  } = state;

  if (!isEqual(tags, previousTags)) {
    const tagList = toTagsList(tags) ?? [];
    await this.updateS3BucketTags(region, name, tagList);
    const updatedAt = new Date().toISOString();
    return {
      arn,
      createdAt,
      updatedAt,
      config,
      dependsOn,
    };
  }
  return state;
}

export type UpdateBucket = typeof updateBucket;

export async function assertBucketExist(this: AWSClient, name: string, region?: string) {
  const start = performance.now();
  const exists = await this.checkS3BucketExists(name, region);
  const end = performance.now();
  logger.debug(`[AWS] Checked bucket ${name} exists in ${formatDuration(end - start)}`);
  if (!exists) {
    throw new PlanError(`Bucket ${name} does not exist`, PlanErrorCode.RESOURCE_NOT_FOUND);
  }
}

export async function assertBucketNameAvailable(this: AWSClient, name: string, region?: string) {
  const start = performance.now();
  const available = await this.checkS3BucketNameAvailable(name, region);
  const end = performance.now();
  logger.debug(`[AWS] Checked bucket ${name} exists in ${formatDuration(end - start)}`);
  if (!available) {
    throw new PlanError(`Cannot use bucket name ${name}`, PlanErrorCode.RESOURCE_CONFLICT);
  }
}

export async function assertCreatePermission(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = s3BucketArn(name);
  const [allowed, reason] = await this.checkPermission(
    ["s3:CreateBucket"],
    [arn],
    [
      {
        ContextKeyName: "aws:RequestedRegion",
        ContextKeyValues: [region],
        ContextKeyType: "string",
      },
    ],
  );
  const end = performance.now();
  logger.debug(`[AWS] Checked permission for s3 bucket ${arn} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(`[AWS] Create permission s3 denied for bucket ${arn}`, reason);
    throw new PlanError(`Cannot create s3 bucket ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}
export async function assertDeletePermission(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = s3BucketArn(name);
  const [allowed, reason] = await this.checkPermission(
    ["s3:DeleteBucket"],
    [arn],
    [
      {
        ContextKeyName: "aws:RequestedRegion",
        ContextKeyValues: [region],
        ContextKeyType: "string",
      },
    ],
  );
  const end = performance.now();
  logger.debug(`[AWS] Checked permission for bucket ${arn} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(`[AWS] Delete permission denied for bucket ${arn}`, reason);
    throw new PlanError(`Cannot delete bucket ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}
export async function assertUpdatePermission(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = s3BucketArn(name);
  const [allowed, reason] = await this.checkPermission(
    ["s3:PutBucketTagging"],
    [arn],
    [
      {
        ContextKeyName: "aws:RequestedRegion",
        ContextKeyValues: [region],
        ContextKeyType: "string",
      },
    ],
  );
  const end = performance.now();
  logger.debug(`[AWS] Checked permission for bucket ${arn} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(`[AWS] Update tags permission denied for bucket ${arn}`, reason);
    throw new PlanError(`Cannot update bucket ${arn}`, PlanErrorCode.PERMISSION_DENIED);
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
