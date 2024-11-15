import { isEqual } from "@es-toolkit/es-toolkit";
import { PlanError, PlanErrorCode } from "../../error.ts";
import { logger } from "../../logger.ts";
import type { WithBranch } from "../../types/config.ts";
import { formatDuration } from "../../utils/duration.ts";
import { assertBranch } from "../../utils/resource.ts";
import type { AWSClient } from "../client/client.ts";
import type { WithRegion } from "../types.ts";
import type {
  FunctionConfig,
  FunctionConfigState,
  FunctionState,
  S3LambdaCode,
  ZipFileLambdaCodeHash,
} from "./types.ts";
import { nowStringDate } from "../../utils/date.ts";
import { hashByteArray } from "../../utils/hash.ts";

function lambdaFunctionArn({ accountId }: AWSClient, name: string, region: string) {
  return `arn:aws:lambda:${region}:${accountId}:function:${name}`;
}

async function isCodeEqual(
  previousCode: FunctionConfigState["code"],
  code: FunctionConfig["code"],
) {
  if ("ZipFile" in previousCode) {
    if ("ZipFile" in code) {
      const hash = await hashByteArray(code.ZipFile);
      return previousCode.ZipFile === hash;
    }
    return false;
  }
  if ("S3Bucket" in previousCode) {
    if ("S3Bucket" in code) {
      return (
        previousCode.S3Bucket === code.S3Bucket &&
        previousCode.S3Key === code.S3Key &&
        previousCode.S3ObjectVersion === code.S3ObjectVersion
      );
    }
    return false;
  }
  if ("ImageUri" in previousCode) {
    if ("ImageUri" in code) {
      return previousCode.ImageUri === code.ImageUri;
    }
    return false;
  }
  return false;
}

export async function isLambdaConfigEqual(
  config: FunctionConfig,
  stateConfig: FunctionConfigState,
) {
  assertBranch(config);
  assertBranch(stateConfig);

  const {
    code: previousCode,
    ...previousConfig
  } = stateConfig;

  const {
    code: nextCode,
    ...configBase
  } = config;

  return isEqual(previousConfig, configBase) && await isCodeEqual(previousCode, nextCode);
}

export async function createFunction(
  this: AWSClient,
  functionName: string,
  config: WithBranch<WithRegion<FunctionConfig>>,
): Promise<FunctionState> {
  assertBranch(config);

  const start = Date.now();

  const {
    tags,
    region,
    roleArn,
  } = config;

  const arn = lambdaFunctionArn(this, functionName, region);

  if (config.packageType === "Image") {
    const {
      memorySize,
      description,
      packageType,
      code,
    } = config;

    await this.createLambdaFunction(region, {
      FunctionName: functionName,
      Description: description,
      Tags: tags,
      PackageType: packageType,
      Role: roleArn,
      MemorySize: memorySize,
      Code: code,
    });

    const end = Date.now();
    logger.debug(`[AWS] Created function ${functionName} in ${formatDuration(end - start)}`);

    const createdAt = nowStringDate();
    return {
      arn,
      createdAt,
      config,
    };
  } else {
    const {
      runtime,
      handler,
      memorySize,
      description,
      packageType,
      code,
    } = config;

    await this.createLambdaFunction(region, {
      FunctionName: functionName,
      Runtime: runtime,
      Description: description,
      Tags: tags,
      PackageType: packageType,
      Role: roleArn,
      Handler: handler,
      MemorySize: memorySize,
      Code: code,
    });
    const end = Date.now();
    logger.debug(`[AWS] Created function ${functionName} in ${formatDuration(end - start)}`);

    const createdAt = nowStringDate();

    if ("ZipFile" in code) {
      const hash = await hashByteArray(code.ZipFile);
      const zipCode: ZipFileLambdaCodeHash = {
        ZipFile: hash,
      };

      return {
        arn,
        createdAt,
        config: {
          ...config,
          code: zipCode,
        },
      };
    }

    if ("S3Bucket" in code) {
      const s3Code: S3LambdaCode = code;

      return {
        arn,
        createdAt,
        config: {
          ...config,
          code: s3Code,
        },
      };
    }
  }
  throw new Error("Invalid code or configuration");
}
export type CreateFunction = typeof createFunction;

export async function deleteFunction(
  this: AWSClient,
  region: string,
  functionName: string,
): Promise<void> {
  const start = performance.now();
  await this.deleteLambdaFunction(region, functionName);
  const end = performance.now();
  logger.debug(`[AWS] Deleted function ${functionName} in ${formatDuration(end - start)}`);
}

export type DeleteFunction = typeof deleteFunction;

export async function updateFunction(
  this: AWSClient,
  config: WithBranch<WithRegion<FunctionConfig>>,
  state: FunctionState,
): Promise<FunctionState> {
  const {
    tags,
    code,
    region,
  } = config;
  const {
    arn,
    createdAt,
    config: {
      tags: previousTags,
      code: previousCode,
    },
  } = state;

  const start = performance.now();

  const configState = {
    ...config,
    code: state.config.code,
  } as WithRegion<WithBranch<FunctionConfigState>>;

  let updatedAt: string | undefined;
  if (!isEqual(previousTags, tags)) {
    logger.debug(`[AWS] Updating tags for lambda function ${arn}`);
    await this.updateLambdaFunctionTags(arn, region, previousTags, tags);
    updatedAt = nowStringDate();
  }

  if (!await isCodeEqual(previousCode, code)) {
    logger.debug(`[AWS] Updating code for lambda function ${arn}`);

    if ("ZipFile" in code) {
      const zipCode: ZipFileLambdaCodeHash = {
        ZipFile: await hashByteArray(code.ZipFile),
      };
      configState.code = zipCode;
      await this.updateLambdaFunctionCode(arn, {
        FunctionName: arn,
        ZipFile: code.ZipFile,
        Publish: true,
      });
    }
    if ("S3Bucket" in code) {
      configState.code = code;
      await this.updateLambdaFunctionCode(arn, {
        FunctionName: arn,
        S3Bucket: code.S3Bucket,
        S3Key: code.S3Key,
        S3ObjectVersion: code.S3ObjectVersion,
        Publish: true,
      });
    }
    if ("ImageUri" in code) {
      configState.code = code;
      await this.updateLambdaFunctionCode(arn, {
        FunctionName: arn,
        ImageUri: code.ImageUri,
        Publish: true,
      });
    }
  }

  updatedAt = nowStringDate();
  const end = performance.now();
  logger.debug(`[AWS] Updating lambda function ${arn} in ${(end - start).toFixed(2)}ms`);

  return {
    arn,
    createdAt,
    updatedAt,
    config: configState,
  };
}

export type UpdateFunction = typeof updateFunction;

export async function assertFunctionExist(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = lambdaFunctionArn(this, name, region);
  const exists = await this.checkLambdaFunctionExists(name, region);
  const end = performance.now();
  logger.debug(`[AWS] Checked lambda function ${arn} exists in ${formatDuration(end - start)}`);
  if (!exists) {
    throw new PlanError(`Lambda function ${arn} does not exist`, PlanErrorCode.RESOURCE_NOT_FOUND);
  }
}

export async function assertFunctionNotExists(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = lambdaFunctionArn(this, name, region);
  const exists = await this.checkLambdaFunctionExists(name, region);
  const end = performance.now();
  logger.debug(`[AWS] Checked lambda function ${arn} exists in ${formatDuration(end - start)}`);
  if (exists) {
    throw new PlanError(`Lambda function ${arn} already exists`, PlanErrorCode.RESOURCE_EXISTS);
  }
}

export async function assertCreatePermission(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = lambdaFunctionArn(this, name, region);
  const [allowed, reason] = await this.checkPermission(
    [
      "lambda:CreateFunction",
      "lambda:TagResource",
    ],
    [arn],
  );
  const end = performance.now();
  logger.debug(`[AWS] Checked permission lambda function ${arn} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(`[AWS] Create permission denied for lambda function ${arn}`, reason);
    throw new PlanError(`Cannot create lambda function ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}
export async function assertDeletePermission(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = lambdaFunctionArn(this, name, region);
  const [allowed, reason] = await this.checkPermission(
    [
      "lambda:DeleteFunction",
      "lambda:DeleteAlias",
      "lambda:DeleteFunctionConcurrency",
      "lambda:DeleteEventSourceMapping",
    ],
    [arn],
  );
  const end = performance.now();
  logger.debug(`[AWS] Checked permission lambda function ${arn} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(`[AWS] Delete permission lambda function ${arn} denied`, reason);
    throw new PlanError(`Cannot delete lambda function ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}
export async function assertUpdatePermission(this: AWSClient, name: string, region: string) {
  const start = performance.now();
  const arn = lambdaFunctionArn(this, name, region);
  const [allowed, reason] = await this.checkPermission(
    [
      "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration",
      "lambda:TagResource",
      "lambda:UntagResource",
    ],
    [arn],
  );
  const end = performance.now();
  logger.debug(`[AWS] Checked permission lambda function ${arn} in ${formatDuration(end - start)}`);
  if (!allowed) {
    logger.error(`[AWS] Update tags permission denied for lambda function ${arn}`, reason);
    throw new PlanError(`Cannot update lambda function ${arn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}

export function getDefaultRegion(this: AWSClient) {
  return this.region ?? this.defaultRegion;
}

export const createS3Executors = (aws: AWSClient) => {
  return {
    getDefaultRegion: getDefaultRegion.bind(aws),

    createFunction: createFunction.bind(aws),
    deleteFunction: deleteFunction.bind(aws),
    updateFunction: updateFunction.bind(aws),

    assertCreatePermission: assertCreatePermission.bind(aws),
    assertDeletePermission: assertDeletePermission.bind(aws),
    assertUpdatePermission: assertUpdatePermission.bind(aws),
    assertFunctionExist: assertFunctionExist.bind(aws),
    assertFunctionNotExists: assertFunctionNotExists.bind(aws),
  };
};

export type Executors = ReturnType<typeof createS3Executors>;
