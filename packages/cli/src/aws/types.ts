import type { S3BucketConfig, S3BucketState } from "./resources/s3/bucket/types.ts";
import type { ObjectsConfig, ObjectsState } from "@/generic/resources/s3/object/types.ts";
import type { Route53RecordConfig, Route53RecordState } from "./resources/route53/record/types.ts";
import type { ResourceConfig } from "../types/config.ts";
import type { IAMRoleConfig, IAMRoleState } from "./resources/iam/role/types.ts";
import type { IAMUserConfig, IAMUserState } from "./resources/iam/user/types.ts";
import type {
  LambdaFunctionConfig,
  LambdaFunctionState,
} from "./resources/lambda/function/types.ts";

import type {
  AppRunnerServiceConfig,
  AppRunnerServiceState,
} from "./resources/appRunner/service/types.ts";
import type {
  CloudwatchLogGroupConfig,
  CloudwatchLogGroupState,
} from "./resources/cloudwatch/logGroup/types.ts";

export interface AWSResource extends ResourceConfig {
  region?: string;
}

export type WithRegion<T extends AWSResource> = T & {
  region: string;
};

export interface AWSResourcesConfig {
  /**
   * App Runner
   */
  appRunner?: {
    service?: AppRunnerServiceConfig;
  };

  /**
   * S3 service
   */
  s3?: {
    bucket?: S3BucketConfig;
    object?: ObjectsConfig;
  };

  /**
   * Route53
   */
  route53?: {
    /**
     * Route53 record config
     */
    record?: Route53RecordConfig;
  };

  /**
   * IAM
   */
  iam?: {
    /**
     * IAM user config
     */
    user?: IAMUserConfig;

    /**
     * IAM role config
     */
    role?: IAMRoleConfig;
  };

  /**
   * Cloudwatch service
   */
  cloudwatch?: {
    logGroup?: CloudwatchLogGroupConfig;
  };

  /**
   * Lambda service
   */
  lambda?: {
    function?: LambdaFunctionConfig;
  };
}

export interface AWSResourcesState {
  /**
   * App Runner Service
   */
  appRunner?: {
    service?: AppRunnerServiceState;
  };

  /**
   * S3 service
   */
  s3: {
    /**
     * S3 state
     */
    bucket?: S3BucketState;
    object?: ObjectsState;
  };

  /**
   * Route53 state
   */
  route53?: {
    record?: Route53RecordState;
  };

  /**
   * IAM
   */
  iam?: {
    user?: IAMUserState;
    role?: IAMRoleState;
  };

  /**
   * Cloudwatch log group state
   */
  cloudwatch: {
    logGroup?: CloudwatchLogGroupState;
  };

  /**
   * Lambda function state
   */
  lambda?: {
    function?: LambdaFunctionState;
  };
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
