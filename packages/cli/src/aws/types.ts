import type { S3BucketConfig, S3BucketState } from "./s3Bucket/types.ts";
import type { S3ObjectConfig, S3ObjectState } from "./s3Object/types.ts";
import type { Route53RecordConfig, Route53RecordState } from "./route53/types.ts";
import type { Resource } from "../types/config.ts";
import type { IAMRoleConfig, IAMRoleState } from "./iamRole/types.ts";
import type {
  CloudwatchLogGroupConfig,
  CloudwatchLogGroupState,
} from "./cloudwatchLogGroup/types.ts";

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
  s3Bucket?: S3BucketConfig;

  /**
   * S3 Object config
   */
  s3Object?: S3ObjectConfig;

  /**
   * Route53 record config
   */
  route53Record?: Route53RecordConfig;

  /**
   * IAM role config
   */
  iamRole?: IAMRoleConfig;

  /**
   * Cloudwatch log group config
   */
  cloudwatchLogGroup?: CloudwatchLogGroupConfig;
}

export interface AWSState {
  /**
   * S3 state
   */
  s3Bucket?: S3BucketState;

  /**
   * S3 Object state
   */
  s3Object?: S3ObjectState;

  /**
   * Route53 state
   */
  route53Record?: Route53RecordState;

  /**
   * IAM role state
   */
  iamRole?: IAMRoleState;

  /**
   * Cloudwatch log group state
   */
  cloudwatchLogGroup?: CloudwatchLogGroupState;
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
