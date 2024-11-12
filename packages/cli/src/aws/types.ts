import type { S3Config, S3State } from "./s3/types.ts";
import type { S3ObjectConfig, S3ObjectState } from "./s3Object/types.ts";
import type { Route53Config, Route53State } from "./route53/types.ts";
import type { Resource } from "../types/config.ts";
import type { IAMRoleConfig, IAMRoleState } from "./iamRole/types.ts";

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
   * S3 Object config
   */
  s3Object?: S3ObjectConfig;

  /**
   * Route53 config
   */
  route53?: Route53Config;

  /**
   * IAM role config
   */
  iamRole?: IAMRoleConfig;
}

export interface AWSState {
  /**
   * S3 state
   */
  s3?: S3State;

  /**
   * S3 Object state
   */
  s3Object?: S3ObjectState;

  /**
   * Route53 state
   */
  route53?: Route53State;

  /**
   * IAM role state
   */
  iamRole?: IAMRoleState;
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
