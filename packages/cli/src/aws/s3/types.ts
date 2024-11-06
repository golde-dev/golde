import type { Resource, Tags, WithBranch } from "../../types/config.ts";

export interface S3BucketConfig extends Resource {
  region?: string;
  tags?: Tags;
}

export interface S3Config {
  [bucketName: string]: S3BucketConfig;
}

export interface S3BucketState {
  createdAt: string;
  arn: string;
  region: string;
  config: WithBranch<S3BucketConfig>;
}

export interface S3State {
  [bucketName: string]: S3BucketState;
}
