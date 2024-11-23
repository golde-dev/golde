import type { Tags, WithBranch } from "../../../types/config.ts";
import type { ResourceDependency } from "../../../types/dependencies.ts";
import type { AWSResource, WithRegion } from "../../types.ts";

export interface LogGroupConfig extends AWSResource {
  retentionInDays?:
    | 1
    | 3
    | 5
    | 7
    | 14
    | 30
    | 60
    | 90
    | 120
    | 150
    | 180
    | 365
    | 400
    | 545
    | 731
    | 1827
    | 2192
    | 2557
    | 2922
    | 3288
    | 3653;
  tags?: Tags;
}

export interface CloudwatchLogGroupConfig {
  [groupName: string]: LogGroupConfig;
}

export interface LogGroupState {
  arn: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  dependsOn: ResourceDependency[];
  config: WithRegion<WithBranch<LogGroupConfig>>;
}

export interface CloudwatchLogGroupState {
  [bucketName: string]: LogGroupState;
}
