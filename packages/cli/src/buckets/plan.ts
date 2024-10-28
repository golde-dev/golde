import { isEmpty } from "moderndash";
import { PlanError, PlanErrorCode } from "../error.ts";
import {
  createCloudflareBucketsExecutors,
  createCloudflareBucketsPlan,
} from "./providers/cloudflare.ts";
import { createAWSBucketsExecutors, createAWSBucketsPlan } from "./providers/aws.ts";
import type { Plan } from "../types/plan.ts";
import type { Context } from "../types/context.ts";

export async function createBucketsPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      buckets: {
        cloudflare: cloudflareState,
        aws: awsState,
      } = {},
    } = {},
    config: {
      buckets: {
        cloudflare: cloudflareConfig,
        aws: awsConfig,
      } = {},
    } = {},
    tags,
    aws,
    cloudflare,
  } = context;

  const promises: Promise<Plan>[] = [];

  if (
    !isEmpty(cloudflareState) ||
    !isEmpty(cloudflareConfig)
  ) {
    if (!cloudflare) {
      throw new PlanError(
        "Cloudflare client is required when using cloudflare r2, ensure that providers.cloudflare is defined in config",
        PlanErrorCode.PROVIDER_MISSING,
      );
    }
    const executors = createCloudflareBucketsExecutors(cloudflare);
    promises.push(createCloudflareBucketsPlan(
      executors,
      tags,
      cloudflareState,
      cloudflareConfig,
    ));
  }

  if (
    !isEmpty(awsConfig) ||
    !isEmpty(awsState)
  ) {
    if (!aws) {
      throw new PlanError(
        "AWS client is required when using aws s3, ensure that providers.aws is defined in config",
        PlanErrorCode.PROVIDER_MISSING,
      );
    }
    const executors = createAWSBucketsExecutors(aws);
    promises.push(createAWSBucketsPlan(
      executors,
      tags,
      awsState,
      awsConfig,
    ));
  }

  return (await Promise.all(promises)).flat();
}
