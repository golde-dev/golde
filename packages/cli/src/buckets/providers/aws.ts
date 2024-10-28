import type { AWSClient } from "../../clients/aws/client.ts";
import type { Tags } from "../../types/config.ts";
import type { Plan } from "../../types/plan.ts";
import type { AWSBuckets, AWSBucketsState } from "../types.ts";

export const createAWSBucketsExecutors = (_aws: AWSClient) => {
  return {};
};

export type AWSExecutors = ReturnType<typeof createAWSBucketsExecutors>;

export async function createAWSBucketsPlan(
  _executors: AWSExecutors,
  _tags?: Tags,
  _state?: AWSBucketsState,
  _config?: AWSBuckets,
): Promise<Plan> {
  return await Promise.resolve([]);
}
