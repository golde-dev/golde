import { logger } from "../../logger.ts";
import { AWSClientBase } from "./base.ts";
import {
  CloudWatchLogsClient as Client,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  DeleteLogStreamCommand,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  PutRetentionPolicyCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import type {
  CreateLogGroupCommandInput,
  CreateLogGroupCommandOutput,
  DeleteLogStreamCommandInput,
  DeleteLogStreamCommandOutput,
} from "@aws-sdk/client-cloudwatch-logs";

const clients = new Map<string, Client>();

export class CloudwatchClient extends AWSClientBase {
  public getCloudwatchLogsClient(region: string = this.region ?? this.defaultRegion): Client {
    if (!clients.has(region)) {
      clients.set(
        region,
        new Client({
          region,
          credentials: {
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey,
          },
        }),
      );
    }
    return clients.get(region)!;
  }

  public async checkCloudwatchLogGroupExists(groupName: string, region?: string) {
    try {
      logger.debug("[AWS] Checking cloudwatch log group exists", { groupName });
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: groupName,
      });
      const response = await this
        .getCloudwatchLogsClient(region)
        .send(command);

      return response
        .logGroups
        ?.some((logGroup) => logGroup.logGroupName === groupName);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to to check cloudwatch log group exists", e);
      }
      throw e;
    }
  }

  public async createCloudwatchLogGroup(
    region: string,
    input: CreateLogGroupCommandInput,
  ): Promise<CreateLogGroupCommandOutput> {
    try {
      logger.debug("[AWS] Creating cloudwatch log group", { region, input });
      const command = new CreateLogGroupCommand(input);
      const result = await this
        .getCloudwatchLogsClient(region)
        .send<CreateLogGroupCommandInput, CreateLogGroupCommandOutput>(command);

      return result;
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to create cloudwatch log group", e);
      }
      throw e;
    }
  }
  public async deleteCloudwatchLogStreamsForLogGroup(
    region: string,
    logGroupName: string,
  ): Promise<void> {
    try {
      logger.debug("[AWS] Deleting cloudwatch log streams for log group", { region, name });
      const describeLogStreamsCommand = new DescribeLogStreamsCommand({
        logGroupName,
      });
      const { logStreams } = await this
        .getCloudwatchLogsClient(region)
        .send(describeLogStreamsCommand);

      if (logStreams) {
        for (const { logStreamName } of logStreams) {
          const command = new DeleteLogStreamCommand({
            logGroupName,
            logStreamName,
          });
          await this
            .getCloudwatchLogsClient(region)
            .send<DeleteLogStreamCommandInput, DeleteLogStreamCommandOutput>(command);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to delete cloudwatch log streams for log group", e);
      }
      throw e;
    }
  }

  public async updateCloudwatchLogGroupRetention(
    region: string,
    groupName: string,
    retentionInDays: number | undefined,
  ): Promise<void> {
    try {
      logger.debug("[AWS] Updating cloudwatch log group retention", {
        region,
        groupName,
        retentionInDays,
      });

      const command = new PutRetentionPolicyCommand({
        logGroupName: groupName,
        retentionInDays,
      });
      await this
        .getCloudwatchLogsClient(region)
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update cloudwatch log group retention", e);
      }
      throw e;
    }
  }

  public async deleteCloudwatchLogGroup(region: string, name: string): Promise<void> {
    try {
      logger.debug("[AWS] Deleting cloudwatch log group", { region, name });

      const command = new DeleteLogGroupCommand({
        logGroupName: name,
      });
      await this
        .getCloudwatchLogsClient(region)
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to delete cloudwatch log group", e);
      }
      throw e;
    }
  }
}
