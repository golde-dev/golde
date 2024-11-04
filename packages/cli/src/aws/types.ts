import type { S3Config, S3State } from "./s3/types.ts";
import type { Route53Config, Route53State } from "./route53/types.ts";

export interface AWSConfig {
  s3?: S3Config;
  route53?: Route53Config;
}

export interface AWSState {
  s3?: S3State;
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
