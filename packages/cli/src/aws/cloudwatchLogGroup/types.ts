import type { Tags, WithBranch } from "../../types/config.ts";
import type { AWSResource, WithRegion } from "../types.ts";

export interface LogGroupConfig extends AWSResource {
  retentionInDays?: number;
  tags?: Tags;
}

export interface CloudwatchLogGroupConfig {
  [groupName: string]: LogGroupConfig;
}

export interface LogGroupState {
  createdAt: string;
  updatedAt?: string;
  arn: string;
  config: WithRegion<WithBranch<LogGroupConfig>>;
}

export interface CloudwatchLogGroupState {
  [bucketName: string]: LogGroupState;
}
