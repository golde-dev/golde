import type { Resource, WithBranch } from "../../types/config.ts";

export interface S3BucketConfig extends Resource {
  region?: string;
}

export interface S3Config {
  [bucketName: string]: S3BucketConfig;
}

export interface S3BucketState {
  createdAt: string;
  location: string;
  arn: string;
  config: WithBranch<S3BucketConfig>;
}

export interface S3State {
  [bucketName: string]: S3BucketState;
}
