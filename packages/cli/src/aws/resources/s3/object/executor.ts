import { isEqual } from "@es-toolkit/es-toolkit";
import { PlanError, PlanErrorCode } from "@/error.ts";
import { logger } from "@/logger.ts";
import { join } from "node:path";
import { formatDuration } from "@/utils/duration.ts";
import { assertBranch } from "@/utils/resource.ts";
import { toTagsList } from "@/utils/tags.ts";
import { nowStringDate } from "@/utils/date.ts";
import type { AWSClient } from "../../../client/client.ts";
import type { Object, ObjectConfig, ObjectState } from "@/generic/resources/s3/object/types.ts";
import type { OmitExecutionContext, WithBranch } from "@/types/config.ts";

function s3ObjectArn(bucketName: string, key: string) {
  return `arn:aws:s3:::${join(bucketName, key)}`;
}

export async function createObject(
  this: AWSClient,
  key: string,
  object: Object,
  config: WithBranch<ObjectConfig>,
): Promise<OmitExecutionContext<ObjectState>> {
  assertBranch(config);

  const {
    tags,
    bucketName,
  } = config;

  const {
    path,
    version,
  } = object;

  const body = await Deno.readFile(path);

  const start = performance.now();
  await this.putS3Object({
    Bucket: bucketName,
    Key: key,
    Body: body,
  });

  const tagList = toTagsList(tags);
  if (tagList) {
    await this.putS3ObjectTags(bucketName, key, tagList);
  }
  const end = performance.now();
  logger.debug(`[Execute][AWS] Created s3 object ${key} in ${formatDuration(end - start)}`);

  const createdAt = nowStringDate();
  return {
    key,
    version,
    createdAt,
    config,
  };
}
export type CreateObject = typeof createObject;

export async function deleteObject(
  this: AWSClient,
  bucketName: string,
  name: string,
): Promise<void> {
  const start = performance.now();
  await this.deleteS3Object(bucketName, name);
  const end = performance.now();
  logger.debug(`[Execute][AWS] Deleted s3 object ${name} in ${formatDuration(end - start)}`);
}

export type DeleteObject = typeof deleteObject;

export async function updateObject(
  this: AWSClient,
  key: string,
  config: WithBranch<ObjectConfig>,
  state: ObjectState,
): Promise<OmitExecutionContext<ObjectState>> {
  const {
    tags,
    bucketName,
  } = config;

  const {
    createdAt,
    version,
    config: {
      tags: previousTags,
    },
  } = state;

  const start = performance.now();

  if (!isEqual(tags, previousTags)) {
    const tagList = toTagsList(tags) ?? [];
    await this.putS3ObjectTags(bucketName, key, tagList);
  }
  const end = performance.now();
  logger.debug(`[Execute][AWS] Updated s3 object ${name} in ${formatDuration(end - start)}`);

  const updatedAt = nowStringDate();
  return {
    key,
    createdAt,
    updatedAt,
    version,
    config,
  };
}

export type UpdateObject = typeof updateObject;

export async function assertObjectExist(this: AWSClient, bucket: string, key: string) {
  const start = performance.now();
  const arn = s3ObjectArn(bucket, key);
  const exists = await this.checkS3ObjectExists(bucket, key);
  const end = performance.now();
  logger.debug(`[Execute][AWS] Checked S3 object ${arn} exists in ${formatDuration(end - start)}`);
  if (!exists) {
    throw new PlanError(`S3 object ${arn} does not exist`, PlanErrorCode.RESOURCE_NOT_FOUND);
  }
}

export async function assertCreatePermission(this: AWSClient, bucket: string, key: string) {
  const start = performance.now();
  const arn = s3ObjectArn(bucket, key);
  const [allowed, reason] = await this.checkPermission(
    ["s3:CreateBucket"],
    [arn],
  );
  const end = performance.now();
  logger.debug(
    `[Plan][AWS] Checked permission for s3 bucket ${arn} in ${formatDuration(end - start)}`,
  );
  if (!allowed) {
    logger.error(reason, `[Execute][AWS] Create permission s3 denied for bucket ${arn}`);
    throw new PlanError(`Cannot create s3 bucket ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}

export async function assertDeletePermission(this: AWSClient, bucket: string, key: string) {
  const start = performance.now();
  const arn = s3ObjectArn(bucket, key);
  const [allowed, reason] = await this.checkPermission(
    ["s3:DeleteBucket"],
    [arn],
  );
  const end = performance.now();
  logger.debug(
    `[Plan][AWS] Checked permission for bucket ${arn} in ${formatDuration(end - start)}`,
  );
  if (!allowed) {
    logger.error(reason, `[Plan][AWS] Delete permission denied for bucket ${arn}`);
    throw new PlanError(`Cannot delete bucket ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}
export async function assertUpdatePermission(this: AWSClient, bucket: string, key: string) {
  const start = performance.now();
  const arn = s3ObjectArn(bucket, key);
  const [allowed, reason] = await this.checkPermission(
    ["s3:PutBucketTagging"],
    [arn],
  );
  const end = performance.now();
  logger.debug(
    `[Plan][AWS] Checked permission for bucket ${arn} in ${formatDuration(end - start)}`,
  );
  if (!allowed) {
    logger.error(reason, `[Plan][AWS] Update tags permission denied for bucket ${arn}`);
    throw new PlanError(`Cannot update bucket ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}

export const createS3ObjectExecutors = (aws: AWSClient) => {
  return {
    createObject: createObject.bind(aws),
    deleteObject: deleteObject.bind(aws),
    updateObject: updateObject.bind(aws),

    assertCreatePermission: assertCreatePermission.bind(aws),
    assertDeletePermission: assertDeletePermission.bind(aws),
    assertUpdatePermission: assertUpdatePermission.bind(aws),
    assertObjectExist: assertObjectExist.bind(aws),
  };
};

export type Executors = ReturnType<typeof createS3ObjectExecutors>;
