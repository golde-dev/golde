import type { AWSClient } from "../client/client.ts";
import type { Tags } from "../../types/config.ts";
import type { Plan } from "../../types/plan.ts";
import type { S3BucketConfig, S3State } from "./types.ts";

export const createS3Executors = (_aws: AWSClient) => {
  return {};
};

export type AWSExecutors = ReturnType<typeof createS3Executors>;

export async function createS3Plan(
  _executors: AWSExecutors,
  _tags?: Tags,
  _state?: S3State,
  _config?: S3BucketConfig,
): Promise<Plan> {
  return await Promise.resolve([]);
}
