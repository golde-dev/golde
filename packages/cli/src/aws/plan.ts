import { isEmpty } from "moderndash";
import { PlanError, PlanErrorCode } from "../error.ts";
import type { Plan } from "../types/plan.ts";
import type { Context } from "../types/context.ts";
import { createRoute53Executors, createRoute53Plan } from "./route53/plan.ts";
import { createS3Executors, createS3Plan } from "./s3/plan.ts";

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
  } = awsConfig ?? {};

  const {
    route53: route53State,
    s3: s3State,
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
    const executors = createS3Executors(aws!);
    plan.push(createS3Plan(
      executors,
      tags,
      s3State,
      s3Config,
    ));
  }

  return (await Promise.all(plan)).flat();
}
