import { isEmpty } from "moderndash";
import { PlanError, PlanErrorCode } from "../error.ts";
import type { Plan } from "../types/plan.ts";
import type { Context } from "../types/context.ts";
import {
  createRoute53DestroyPlan,
  createRoute53Executors,
  createRoute53Plan,
} from "./route53/plan.ts";
import { createS3DestroyPlan, createS3Plan } from "./s3/plan.ts";
import { createS3Executors } from "./s3/executor.ts";
import {
  createS3ObjectDestroyPlan,
  createS3ObjectExecutors,
  createS3ObjectPlan,
} from "./s3Object/plan.ts";
import { createIAMRoleDestroyPlan, createIAMRolePlan } from "./iamRole/plan.ts";
import { createIAMRoleExecutors } from "./iamRole/executor.ts";

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
    route53: route53Config,
    s3: s3Config,
    s3Object: s3ObjectConfig,
    iamRole: iamRoleConfig,
  } = awsConfig ?? {};

  const {
    route53: route53State,
    s3: s3State,
    s3Object: s3ObjectState,
    iamRole: iamRoleState,
  } = awsState ?? {};

  if (!isEmpty(route53State) || !isEmpty(route53Config)) {
    const executors = createRoute53Executors(aws);
    plan.push(createRoute53Plan(
      executors,
      tags,
      route53State,
      route53Config,
    ));
  }

  if (!isEmpty(s3State) || !isEmpty(s3Config)) {
    const executors = createS3Executors(aws);
    plan.push(createS3Plan(
      executors,
      tags,
      s3State,
      s3Config,
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
    route53: route53State,
    s3: s3State,
    s3Object: s3ObjectState,
    iamRole: iamRoleState,
  } = awsState ?? {};

  if (!isEmpty(route53State)) {
    const executors = createRoute53Executors(aws);
    plan.push(createRoute53DestroyPlan(
      executors,
      route53State,
    ));
  }

  if (!isEmpty(s3State)) {
    const executors = createS3Executors(aws);
    plan.push(createS3DestroyPlan(
      executors,
      s3State,
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

  return (await Promise.all(plan)).flat();
}
