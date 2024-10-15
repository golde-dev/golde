import type { CloudflareClient } from "../../clients/cloudflare.ts";
import type { GitInfo } from "../../clients/git.ts";
import type { Plan } from "../../types/plan.ts";
import { assertBranch } from "../../utils/resource.ts";
import type {
  CloudflareBucket,
  CloudflareBuckets,
  CloudflareBucketsState,
  CloudflareBucketState,
} from "../types.ts";

export async function createBucket(
  this: CloudflareClient,
  name: string,
  config: CloudflareBucket,
): Promise<CloudflareBucketState> {
  assertBranch(config);

  return await this.createBucket({
    name,
    locationHint: config.locationHint,
    storageClass: config.storageClass,
  }).then((b) => {
    return {
      location: b.location,
      createdAt: b.creation_date,
      storageClass: b.storage_class,
      config,
    };
  });
}
export type CreateBucket = typeof createBucket;

export function updateBucket(
  this: CloudflareClient,
) {
  throw new Error("It is not possible to update r2 bucket, create new and migrate data");
}

export async function deleteBucket(this: CloudflareClient, name: string) {
  return await this.deleteBucket(name);
}
export type DeleteBucket = typeof deleteBucket;

export const createCloudflareBucketsExecutors = (cloudflare: CloudflareClient) => {
  return {
    createBucket: createBucket.bind(cloudflare),
    deleteBucket: deleteBucket.bind(cloudflare),
    updateBucket: updateBucket.bind(cloudflare),
  };
};

export type Executors = ReturnType<typeof createCloudflareBucketsExecutors>;

export const createCloudflareBucketsPlan = (
  executors: Executors,
  git: GitInfo,
  state?: CloudflareBucketsState,
  config?: CloudflareBuckets,
): Promise<Plan> => {
  console.log({
    executors,
    state,
    config,
    git,
  });
  return Promise.resolve([]);
};
