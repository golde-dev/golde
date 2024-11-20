import type { Resource, Tags, WithBranch } from "../../types/config.ts";
import type { ResourceDependency } from "../../types/dependencies.ts";
import type { WithRegion } from "../types.ts";

export interface BucketConfig extends Resource {
  region?: string;
  tags?: Tags;
}

export interface S3BucketConfig {
  [bucketName: string]: BucketConfig;
}

export interface BucketState {
  createdAt: string;
  updatedAt?: string;
  arn: string;
  dependsOn: ResourceDependency[];
  config: WithRegion<WithBranch<BucketConfig>>;
}

export interface S3BucketState {
  [bucketName: string]: BucketState;
}
