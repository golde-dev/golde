import { isEqual } from "es-toolkit";
import { PlanError, PlanErrorCode } from "../../../../error.ts";
import { logger } from "../../../../logger.ts";
import type { WithBranch } from "../../../../types/config.ts";
import { formatDuration } from "../../../../utils/duration.ts";
import { assertBranch } from "../../../../utils/resource.ts";
import type { AWSClient } from "../../../client/client.ts";
import type { WithRegion } from "../../../types.ts";
import type { LogGroupConfig, LogGroupState } from "./types.ts";
import { nowStringDate } from "../../../../utils/date.ts";
import type { OmitExecutionContext } from "@/types/config.ts";

function logGroupArn({ accountId }: AWSClient, region: string, name: string) {
  if (!accountId) {
    throw new Error("AWS client not initialized");
  }
  return `arn:aws:logs:${region}:${accountId}:log-group:${name}`;
}

function logGroupStreamsArn({ accountId }: AWSClient, region: string, name: string) {
  if (!accountId) {
    throw new Error("AWS client not initialized");
  }
  return `arn:aws:logs:${region}:${accountId}:log-group:${name}:log-stream:*`;
}

export async function createLogGroup(
  this: AWSClient,
  name: string,
  config: WithBranch<WithRegion<LogGroupConfig>>,
): Promise<OmitExecutionContext<LogGroupState>> {
  assertBranch(config);

  const {
    region,
    tags,
  } = config;

  const start = performance.now();
  await this.createCloudwatchLogGroup(region, {
    logGroupName: name,
    tags,
  });
  const end = performance.now();
  logger.debug(`[Execute][AWS] Created log group ${name} in ${formatDuration(end - start)}`);

  const arn = logGroupArn(this, region, name);
  const createdAt = nowStringDate();
  return {
    arn,
    name,
    createdAt,
    config,
  };
}
export type CreateLogGroup = typeof createLogGroup;

export async function deleteLogGroup(
  this: AWSClient,
  region: string,
  name: string,
): Promise<void> {
  const start = Date.now();

  await this.deleteCloudwatchLogStreamsForLogGroup(region, name);
  await this.deleteCloudwatchLogGroup(region, name);

  const end = Date.now();
  logger.debug(
    `[Execute][AWS] Deleted cloudwatch log group ${name} in ${formatDuration(end - start)}`,
  );
}

export type DeleteLogGroup = typeof deleteLogGroup;

export async function updateLogGroup(
  this: AWSClient,
  region: string,
  name: string,
  config: WithBranch<WithRegion<LogGroupConfig>>,
  state: LogGroupState,
): Promise<OmitExecutionContext<LogGroupState>> {
  const {
    tags,
    retentionInDays,
  } = config;

  const {
    arn,
    createdAt,
    config: {
      tags: previousTags,
      retentionInDays: previousRetentionInDays,
    },
  } = state;

  const start = performance.now();

  let updatedAt: string | undefined;
  if (!isEqual(retentionInDays, previousRetentionInDays)) {
    await this.updateCloudwatchLogGroupRetention(region, name, retentionInDays);
    updatedAt = nowStringDate();
  }

  if (!isEqual(tags, previousTags)) {
    await this.updateResourceTags(arn, previousTags, tags);
    updatedAt = nowStringDate();
  }

  const end = performance.now();
  logger.debug(
    `[Execute][AWS] Updated cloudwatch log group ${name} in ${formatDuration(end - start)}`,
  );

  return {
    arn,
    name,
    createdAt,
    updatedAt,
    config,
  };
}

export type UpdateLogGroup = typeof updateLogGroup;

export async function assertLogGroupExists(this: AWSClient, name: string, region?: string) {
  const start = performance.now();
  const exists = await this.checkCloudwatchLogGroupExists(name, region);
  const end = performance.now();
  logger.debug(
    `[AWS] Checked cloudwatch log group ${name} exists in ${formatDuration(end - start)}`,
  );
  if (!exists) {
    throw new PlanError(
      `Cloudwatch log group ${name} does not exist`,
      PlanErrorCode.RESOURCE_NOT_FOUND,
    );
  }
}

export async function assertLogGroupNotExists(this: AWSClient, name: string, region?: string) {
  const start = performance.now();
  const exists = await this.checkCloudwatchLogGroupExists(name, region);
  const end = performance.now();
  logger.debug(
    `[AWS] Checked cloudwatch log group ${name} exists in ${formatDuration(end - start)}`,
  );
  if (exists) {
    throw new PlanError(
      `Cloudwatch log group ${name} already exists`,
      PlanErrorCode.RESOURCE_EXISTS,
    );
  }
}

export async function assertCreatePermission(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = logGroupArn(this, region, name);
  const [allowed, reason] = await this.checkPermission(
    ["logs:TagLogGroup", "logs:CreateLogGroup"],
    [arn],
  );
  const end = performance.now();
  logger.debug(`[Plan][AWS][Cloudwatch] Checked permission for logGroup ${arn} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(reason, `[Plan][AWS][Cloudwatch] Create permission denied for log group ${arn}`);
    throw new PlanError(`Cannot create log group ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}
export async function assertDeletePermission(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = logGroupArn(this, region, name);
  const streamsArn = logGroupStreamsArn(this, region, name);
  const [allowed, reason] = await this.checkPermission(
    [
      "logs:DeleteLogGroup",
      "logs:DeleteLogStream",
      "logs:DeleteSubscriptionFilter",
    ],
    [arn, streamsArn],
  );
  const end = performance.now();
  logger.debug(`[Plan][AWS][Cloudwatch] Checked permission for log group ${arn} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(reason, `[Plan][AWS][Cloudwatch] Delete permission denied for log group ${arn}`);
    throw new PlanError(`Cannot delete log group ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}
export async function assertUpdatePermission(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = logGroupArn(this, region, name);
  const [allowed, reason] = await this.checkPermission(
    [
      "logs:TagLogGroup",
      "logs:UntagLogGroup",
      "logs:PutResourcePolicy",
      "logs:PutRetentionPolicy",
    ],
    [arn],
  );
  const end = performance.now();
  logger.debug(`[Plan][AWS][Cloudwatch] Checked permission for log group ${arn} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(reason, `[Plan][AWS][Cloudwatch] Update permission denied for log group ${arn}`);
    throw new PlanError(`Cannot update log group ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}

export function getDefaultRegion(this: AWSClient) {
  return this.region ?? this.defaultRegion;
}

export const createCloudwatchLogGroupExecutors = (aws: AWSClient) => {
  return {
    getDefaultRegion: getDefaultRegion.bind(aws),

    createLogGroup: createLogGroup.bind(aws),
    deleteLogGroup: deleteLogGroup.bind(aws),
    updateLogGroup: updateLogGroup.bind(aws),

    assertCreatePermission: assertCreatePermission.bind(aws),
    assertDeletePermission: assertDeletePermission.bind(aws),
    assertUpdatePermission: assertUpdatePermission.bind(aws),
    assertLogGroupExists: assertLogGroupExists.bind(aws),
    assertLogGroupNotExists: assertLogGroupNotExists.bind(aws),
  };
};

export type Executors = ReturnType<typeof createCloudwatchLogGroupExecutors>;
