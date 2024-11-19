import { isEmpty } from "../utils/object.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import type { Plan } from "../types/plan.ts";
import type { Context } from "../types/context.ts";
import {
  createRoute53DestroyPlan,
  createRoute53Executors,
  createRoute53Plan,
} from "./route53Record/plan.ts";
import { createS3DestroyPlan, createS3Plan } from "./s3Bucket/plan.ts";
import { createS3Executors } from "./s3Bucket/executor.ts";
import {
  createS3ObjectDestroyPlan,
  createS3ObjectExecutors,
  createS3ObjectPlan,
} from "./s3Object/plan.ts";
import { createIAMRoleDestroyPlan, createIAMRolePlan } from "./iamRole/plan.ts";
import { createIAMRoleExecutors } from "./iamRole/executor.ts";
import { createCloudwatchLogGroupExecutors } from "./cloudwatchLogGroup/executor.ts";
import {
  createCloudwatchLogGroupDestroyPlan,
  createCloudwatchLogGroupPlan,
} from "./cloudwatchLogGroup/plan.ts";
import {
  createLambdaFunctionDestroyPlan,
  createLambdaFunctionPlan,
} from "./lambdaFunction/plan.ts";
import { createLambdaFunctionExecutors } from "./lambdaFunction/executor.ts";

export async function createAWSPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      aws: awsState,
    } = {},
    config: {
      aws: awsConfig,
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
    route53Record: route53RecordConfig,
    s3Bucket: s3BucketConfig,
    s3Object: s3ObjectConfig,
    iamRole: iamRoleConfig,
    cloudwatchLogGroup: cloudwatchLogGroupConfig,
    lambdaFunction: lambdaFunctionConfig,
  } = awsConfig ?? {};

  const {
    route53Record: route53RecordState,
    s3Bucket: s3BucketState,
    s3Object: s3ObjectState,
    iamRole: iamRoleState,
    cloudwatchLogGroup: cloudwatchLogGroupState,
    lambdaFunction: lambdaFunctionState,
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
    plan.push(createS3ObjectPlan(
      executors,
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
    route53Record: route53State,
    s3Bucket: s3BucketState,
    s3Object: s3ObjectState,
    iamRole: iamRoleState,
    cloudwatchLogGroup: cloudwatchLogGroupState,
    lambdaFunction: lambdaFunctionState,
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
    plan.push(createS3ObjectDestroyPlan(
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
