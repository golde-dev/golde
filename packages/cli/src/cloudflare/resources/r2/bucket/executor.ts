import { logger } from "../../../../logger.ts";
import type { OmitExecutionContext, WithBranch } from "../../../../types/config.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";
import { formatDuration } from "../../../../utils/duration.ts";
import type { CloudflareClient } from "../../../client/client.ts";
import type { BucketConfig, BucketState } from "./types.ts";

export async function createBucket(
  this: CloudflareClient,
  name: string,
  config: WithBranch<BucketConfig>,
  dependsOn: ResourceDependency[] = [],
): Promise<OmitExecutionContext<BucketState>> {
  const start = Date.now();
  const bucket = await this.createBucket({
    name,
    locationHint: config.locationHint,
    storageClass: config.storageClass,
  }).then((b) => {
    return {
      location: b.location,
      createdAt: b.creation_date,
      name,
      config,
      dependsOn,
    };
  });
  const end = Date.now();
  logger.debug(`[Cloudflare]: created bucket ${name} in ${formatDuration(end - start)}`);
  return bucket;
}
export type CreateBucket = typeof createBucket;

export async function deleteBucket(this: CloudflareClient, name: string) {
  const start = Date.now();
  await this.deleteBucket(name);
  const end = Date.now();

  logger.debug(`[Cloudflare]: deleting bucket ${name} in ${formatDuration(end - start)}`);
}
export type DeleteBucket = typeof deleteBucket;

export const createR2Executors = (cloudflare: CloudflareClient) => {
  return {
    createBucket: createBucket.bind(cloudflare),
    deleteBucket: deleteBucket.bind(cloudflare),
  };
};

export type Executors = ReturnType<typeof createR2Executors>;
