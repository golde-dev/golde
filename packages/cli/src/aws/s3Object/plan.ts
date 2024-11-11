import { logger } from "../../logger.ts";
import type { Plan } from "../../types/plan.ts";
import type { AWSClient } from "../client/client.ts";
import type { S3ObjectConfig, S3ObjectState } from "./types.ts";

export async function createS3ObjectExecutors(_aws: AWSClient) {
}

export type Executors = ReturnType<typeof createS3ObjectExecutors>;

export async function createS3ObjectPlan(
  _executors: Executors,
  state?: S3ObjectState,
  config?: S3ObjectConfig,
): Promise<Plan> {
  logger.debug("[S3Object] Planning changes", { state, config });
  return await Promise.resolve([]);
}

export async function createS3ObjectDestroyPlan(
  _executors: Executors,
  state?: S3ObjectState,
): Promise<Plan> {
  logger.debug("[S3Object] Planning destroying changes", { state });
  return await Promise.resolve([]);
}
