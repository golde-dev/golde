import type { S3Config, S3State } from "./s3/types.ts";
import type { Route53Config, Route53State } from "./route53/types.ts";
import type { Resource } from "../types/config.ts";

export interface AWSResource extends Resource {
  region?: string;
}
export type WithRegion<T extends AWSResource> = T & {
  region: string;
};

export interface AWSConfig {
  /**
   * S3 config
   */
  s3?: S3Config;
  /**
   * Route53 config
   */
  route53?: Route53Config;
}

export interface AWSState {
  /**
   * S3 state
   */
  s3?: S3State;
  /**
   * Route53 state
   */
  route53?: Route53State;
}

export interface AWSCredentials {
  /**
   * AWS region to use when managing aws resources
   */
  region?: string;
  /**
   * AWS access key id
   */
  accessKeyId: string;
  /**
   * AWS secret access key
   */
  secretAccessKey: string;
}
