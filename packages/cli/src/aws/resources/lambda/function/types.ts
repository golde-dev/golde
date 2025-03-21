import type { ResourceConfig, Tags, WithBranch } from "../../../../types/config.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";
import type { WithRegion } from "../../../types.ts";

type LambdaRuntime =
  | "nodejs20.x"
  | "nodejs18.x"
  | "nodejs14.x"
  | "python3.13"
  | "python3.12"
  | "python3.11"
  | "python3.10"
  | "python3.9"
  | "java21"
  | "java17"
  | "java11"
  | "java8.al2"
  | "dotnet8"
  | "dotnet6"
  | "ruby3.3"
  | "ruby3.2"
  | "provided.al2023"
  | "provided.al2";

export interface LoggingConfig {
  logGroupName?: string;
}

export type ImageLambdaCode = {
  imageUri: string;
};

export type S3LambdaCode = {
  s3Bucket: string;
  s3Key: string;
  s3ObjectVersion?: string;
};

export type ZipFileLambdaCode = {
  zipFile: string;
};

export type ZipLambdaCode =
  | ZipFileLambdaCode
  | S3LambdaCode;

export interface BaseFunctionConfig {
  tags?: Tags;
  region?: string;
  description?: string;
  /**
   * ARNs of layers
   */
  layerArns?: string[];
  /**
   * ARN of execution role
   */
  roleArn: string;
  /**
   * Memory size in MB
   */
  memorySize?: number;
  /**
   * Timeout in seconds
   */
  timeout?: number;

  /**
   * Logging config
   */
  loggingConfig?: LoggingConfig;
}

export interface ZipFunctionConfig extends BaseFunctionConfig, ResourceConfig {
  packageType: "Zip";
  region?: string;
  handler: string;
  runtime: LambdaRuntime;
  code: ZipLambdaCode;
}

export interface ImageFunctionConfig extends BaseFunctionConfig, ResourceConfig {
  packageType: "Image";
  region?: string;
  tags?: Tags;
  code: ImageLambdaCode;
}

export type FunctionConfig = ImageFunctionConfig | ZipFunctionConfig;

export interface LambdaFunctionConfig {
  [functionName: string]: FunctionConfig;
}

export type FunctionConfigState = ImageFunctionConfig | ZipFunctionConfig;

export interface FunctionState {
  createdAt: string;
  updatedAt?: string;
  arn: string;
  dependsOn: ResourceDependency[];
  config: WithRegion<WithBranch<FunctionConfigState>>;
}

export interface LambdaFunctionState {
  [functionName: string]: FunctionState;
}
