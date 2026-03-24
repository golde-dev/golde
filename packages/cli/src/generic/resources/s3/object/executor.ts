import { isEqual } from "es-toolkit";
import { PlanError, PlanErrorCode } from "@/error.ts";
import { logger } from "@/logger.ts";
import { formatDuration } from "@/utils/duration.ts";
import { assertBranch } from "@/utils/resource.ts";
import { toTagsList } from "@/utils/tags.ts";
import { nowStringDate } from "@/utils/date.ts";
import type { Object, ObjectConfig, ObjectState } from "@/generic/resources/s3/object/types.ts";
import type { OmitExecutionContext, WithBranch } from "@/types/config.ts";
import type { S3 } from "@/generic/client/s3.ts";
import { readFile } from "node:fs/promises";

export interface GenericExecutors {
  createObject: (
    name: string,
    object: { path: string; version: string },
    config: WithBranch<ObjectConfig>,
  ) => Promise<OmitExecutionContext<ObjectState>>;
  updateObject: (
    key: string,
    config: WithBranch<ObjectConfig>,
    state: ObjectState,
  ) => Promise<OmitExecutionContext<ObjectState>>;
  deleteObject: (bucketName: string, name: string) => Promise<void>;
  assertCreatePermission?: (bucketName: string, name: string) => Promise<void>;
  assertDeletePermission?: (bucketName: string, name: string) => Promise<void>;
  assertUpdatePermission?: (bucketName: string, name: string) => Promise<void>;
  assertObjectExist: (bucketName: string, name: string) => Promise<void>;
}

export const createObjectExecutors = (client: S3): GenericExecutors => {
  const {
    provider,
    serviceName,
  } = client.getProviderInfo();

  async function createObject(
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

    const body = await readFile(path);

    const start = performance.now();
    await client.putS3Object({
      Bucket: bucketName,
      Key: key,
      Body: body,
    });

    const tagList = toTagsList(tags);
    if (tagList) {
      await client.putS3ObjectTags(bucketName, key, tagList);
    }
    const end = performance.now();
    logger.debug(
      `[Execute][${provider}] Created ${serviceName} object ${key} in ${
        formatDuration(end - start)
      }`,
    );

    const createdAt = nowStringDate();
    return {
      key,
      version,
      createdAt,
      config,
    };
  }

  async function deleteObject(
    bucketName: string,
    name: string,
  ): Promise<void> {
    const start = performance.now();
    await client.deleteS3Object(bucketName, name);
    const end = performance.now();
    logger.debug(
      `[${provider}] Deleted ${serviceName} object ${name} in ${formatDuration(end - start)}`,
    );
  }

  async function updateObject(
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
      await client.putS3ObjectTags(bucketName, key, tagList);
    }
    const end = performance.now();
    logger.debug(
      `[Execute][${provider}] Updated ${serviceName} object ${name} in ${
        formatDuration(end - start)
      }`,
    );

    const updatedAt = nowStringDate();
    return {
      key,
      createdAt,
      updatedAt,
      version,
      config,
    };
  }

  async function assertObjectExist(bucket: string, key: string) {
    const start = performance.now();
    const exists = await client.checkS3ObjectExists(bucket, key);
    const end = performance.now();
    logger.debug(
      `[Plan][${provider}] Checked ${serviceName} object ${key} exists in ${
        formatDuration(end - start)
      }`,
    );
    if (!exists) {
      throw new PlanError(
        `${serviceName} object ${key} does not exist`,
        PlanErrorCode.RESOURCE_NOT_FOUND,
      );
    }
  }

  return {
    createObject: createObject,
    deleteObject: deleteObject,
    updateObject: updateObject,

    assertObjectExist: assertObjectExist,
  };
};

export type Executors = ReturnType<typeof createObjectExecutors>;
