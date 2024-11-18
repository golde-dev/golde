import type { Resource, Tags, WithBranch } from "../../types/config.ts";
import type { WithRegion } from "../types.ts";

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

export type ImageLambdaCode = {
  imageUri: string;
};

export type S3LambdaCode = {
  s3Bucket: string;
  s3Key: string;
  s3ObjectVersion?: string;
};

export type ZipFileLambdaCode = {
  zipFile: Uint8Array;
};

export type ZipFileLambdaCodeHash = {
  zipFile: string;
};

/**
 * During configuration we will read zip file into memory as Uint8Array
 * Once file is loaded we can hash it during creation and store hash in state
 */
export type ZipLambdaCode =
  | ZipFileLambdaCode
  | S3LambdaCode;

/**
 * When storing zip function in state we do not want to store actual zip
 * Config state for will ZipFile will store hash of zip file instead
 */
export type ZipLambdaCodeState =
  | ZipFileLambdaCodeHash
  | S3LambdaCode;

export interface BaseFunctionConfig {
  tags?: Tags;
  region?: string;
  description?: string;
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
}

export interface ZipFunctionConfig extends BaseFunctionConfig, Resource {
  packageType: "Zip";
  region?: string;
  handler: string;
  runtime: LambdaRuntime;
  code: ZipLambdaCode;
}

export interface ZipFunctionConfigState extends BaseFunctionConfig, Resource {
  packageType: "Zip";
  region?: string;
  handler: string;
  runtime: LambdaRuntime;
  code: ZipLambdaCodeState;
}

export interface ImageFunctionConfig extends BaseFunctionConfig, Resource {
  packageType: "Image";
  region?: string;
  tags?: Tags;
  code: ImageLambdaCode;
}

export type FunctionConfig = ImageFunctionConfig | ZipFunctionConfig;

export interface LambdaFunctionConfig {
  [functionName: string]: FunctionConfig;
}

export type FunctionConfigState = ImageFunctionConfig | ZipFunctionConfigState;

export interface FunctionState {
  createdAt: string;
  updatedAt?: string;
  arn: string;
  config: WithRegion<WithBranch<FunctionConfigState>>;
}

export interface LambdaFunctionState {
  [functionName: string]: FunctionState;
}
