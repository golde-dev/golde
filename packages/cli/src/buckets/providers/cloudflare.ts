import type { BucketRequest, CloudflareClient } from "../../clients/cloudflare.ts";
import type { GitInfo } from "../../clients/git.ts";
import type { Plan } from "../../types/plan.ts";
import type { CloudflareBuckets, CloudflareBucketsState, CloudflareBucketState } from "../types.ts";

export async function createBucket(
  this: CloudflareClient,
  branch: string,
  config: BucketRequest,
): Promise<CloudflareBucketState> {
  return await this.createBucket(config).then((b) => {
    return {
      branch,
      location: b.location,
      createdAt: b.creation_date,
      storageClass: b.storage_class,
    };
  });
}

export function updateBucket(
  this: CloudflareClient,
) {
  throw Promise.reject(
    new Error("It is not possible to update r2 bucket, create new and migrate data"),
  );
}

export async function deleteBucket(this: CloudflareClient, name: string) {
  return await this.deleteBucket(name);
}

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
  prevConfig?: CloudflareBuckets,
  prevState?: CloudflareBucketsState,
  nextConfig?: CloudflareBuckets,
): Promise<Plan> => {
  console.log({
    executors,
    prevConfig,
    prevState,
    nextConfig,
    git,
  });
  return Promise.resolve([]);
};
