import { isEmpty } from "../utils/object.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import { createS3DestroyPlan, createS3Plan } from "./resources/s3/bucket/plan.ts";
import { createS3Executors } from "./resources/s3/bucket/executor.ts";
import { createS3ObjectsDestroyPlan, createS3ObjectsPlan } from "./resources/s3/object/plan.ts";
import { createS3ObjectExecutors } from "./resources/s3/object/executor.ts";
import { createIAMRoleDestroyPlan, createIAMRolePlan } from "./resources/iam/role/plan.ts";
import { createIAMRoleExecutors } from "./resources/iam/role/executor.ts";
import { createCloudwatchLogGroupExecutors } from "./resources/cloudwatch/logGroup/executor.ts";
import { createLambdaFunctionExecutors } from "./resources/lambda/function/executor.ts";
import {
  createRoute53DestroyPlan,
  createRoute53Executors,
  createRoute53Plan,
} from "./resources/route53/record/plan.ts";
import {
  createCloudwatchLogGroupDestroyPlan,
  createCloudwatchLogGroupPlan,
} from "./resources/cloudwatch/logGroup/plan.ts";
import {
  createLambdaFunctionDestroyPlan,
  createLambdaFunctionPlan,
} from "./resources/lambda/function/plan.ts";
import type { Plan } from "../types/plan.ts";
import type { Context } from "../types/context.ts";
import { logger } from "@/logger.ts";

export async function createAWSPlan(context: Context): Promise<Plan> {
  logger.debug("[Plan][AWS] Creating plan");
  const {
    previousState: {
      aws: awsState,
    } = {},
    config: {
      resources: {
        aws: awsConfig,
      } = {},
    },
    aws,
    tags,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(awsState) && isEmpty(awsConfig)) {
    return [];
  }

  if (!aws) {
    throw new PlanError(
      "AWS provider is required when using aws, ensure that providers.aws is defined",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }

  const {
    route53: {
      record: route53RecordConfig,
    } = {},
    s3: {
      bucket: s3BucketConfig,
      object: s3ObjectConfig,
    } = {},
    iam: {
      role: iamRoleConfig,
    } = {},
    cloudwatch: {
      logGroup: cloudwatchLogGroupConfig,
    } = {},
    lambda: {
      function: lambdaFunctionConfig,
    } = {},
  } = awsConfig ?? {};

  const {
    route53: {
      record: route53RecordState,
    } = {},
    s3: {
      bucket: s3BucketState,
      object: s3ObjectState,
    } = {},
    iam: {
      role: iamRoleState,
    } = {},
    cloudwatch: {
      logGroup: cloudwatchLogGroupState,
    } = {},
    lambda: {
      function: lambdaFunctionState,
    } = {},
  } = awsState ?? {};

  if (!isEmpty(route53RecordState) || !isEmpty(route53RecordConfig)) {
    const executors = createRoute53Executors(aws);
    plan.push(createRoute53Plan(
      executors,
      tags,
      route53RecordState,
      route53RecordConfig,
    ));
  }

  if (!isEmpty(s3BucketState) || !isEmpty(s3BucketConfig)) {
    const executors = createS3Executors(aws);
    plan.push(createS3Plan(
      executors,
      tags,
      s3BucketState,
      s3BucketConfig,
    ));
  }

  if (!isEmpty(s3ObjectState) || !isEmpty(s3ObjectConfig)) {
    const executors = createS3ObjectExecutors(aws);
    plan.push(createS3ObjectsPlan(
      executors,
      tags,
      s3ObjectState,
      s3ObjectConfig,
    ));
  }

  if (!isEmpty(iamRoleConfig) || !isEmpty(iamRoleState)) {
    const executors = createIAMRoleExecutors(aws);
    plan.push(createIAMRolePlan(
      executors,
      tags,
      iamRoleState,
      iamRoleConfig,
    ));
  }

  if (!isEmpty(cloudwatchLogGroupConfig) || !isEmpty(cloudwatchLogGroupState)) {
    const executors = createCloudwatchLogGroupExecutors(aws);
    plan.push(createCloudwatchLogGroupPlan(
      executors,
      tags,
      cloudwatchLogGroupState,
      cloudwatchLogGroupConfig,
    ));
  }

  if (!isEmpty(lambdaFunctionConfig) || !isEmpty(lambdaFunctionState)) {
    const executors = createLambdaFunctionExecutors(aws);
    plan.push(createLambdaFunctionPlan(
      executors,
      tags,
      lambdaFunctionState,
      lambdaFunctionConfig,
    ));
  }
  logger.debug(`[AWS] Created plan, items: ${plan.length}`);
  return (await Promise.all(plan)).flat();
}

export async function createAWSDestroyPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      aws: awsState,
    } = {},
    aws,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(awsState)) {
    return [];
  }

  if (!aws) {
    throw new PlanError(
      "AWS provider is required when using aws, ensure that providers.aws is defined",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }
  const {
    route53: {
      record: route53State,
    } = {},
    s3: {
      bucket: s3BucketState,
      object: s3ObjectState,
    } = {},
    iam: {
      role: iamRoleState,
    } = {},
    cloudwatch: {
      logGroup: cloudwatchLogGroupState,
    } = {},
    lambda: {
      function: lambdaFunctionState,
    } = {},
  } = awsState ?? {};

  if (!isEmpty(route53State)) {
    const executors = createRoute53Executors(aws);
    plan.push(createRoute53DestroyPlan(
      executors,
      route53State,
    ));
  }

  if (!isEmpty(s3BucketState)) {
    const executors = createS3Executors(aws);
    plan.push(createS3DestroyPlan(
      executors,
      s3BucketState,
    ));
  }

  if (!isEmpty(s3ObjectState)) {
    const executors = createS3ObjectExecutors(aws);
    plan.push(createS3ObjectsDestroyPlan(
      executors,
      s3ObjectState,
    ));
  }

  if (!isEmpty(iamRoleState)) {
    const executors = createIAMRoleExecutors(aws);
    plan.push(createIAMRoleDestroyPlan(
      executors,
      iamRoleState,
    ));
  }
  if (!isEmpty(cloudwatchLogGroupState)) {
    const executors = createCloudwatchLogGroupExecutors(aws);
    plan.push(createCloudwatchLogGroupDestroyPlan(
      executors,
      cloudwatchLogGroupState,
    ));
  }
  if (!isEmpty(lambdaFunctionState)) {
    const executors = createLambdaFunctionExecutors(aws);
    plan.push(createLambdaFunctionDestroyPlan(
      executors,
      lambdaFunctionState,
    ));
  }

  return (await Promise.all(plan)).flat();
}
