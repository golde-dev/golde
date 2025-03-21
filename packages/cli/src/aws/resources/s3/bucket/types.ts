import type { ResourceConfig, ResourceState, Tags, WithBranch } from "../../../../types/config.ts";
import type { WithRegion } from "../../../types.ts";

export interface BucketConfig extends ResourceConfig {
  region?: string;
  tags?: Tags;
}

export interface S3BucketConfig {
  [bucketName: string]: BucketConfig;
}

export interface BucketState extends ResourceState {
  createdAt: string;
  updatedAt?: string;
  arn: string;
  name: string;
  config: WithRegion<WithBranch<BucketConfig>>;
}

export interface S3BucketState {
  [bucketName: string]: BucketState;
}
