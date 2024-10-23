import type { Region, StorageClass } from "../clients/cloudflare/types.ts";
import type { Resource, WithBranch } from "../types/config.ts";

export interface CloudflareBucket extends Resource {
  locationHint?: Region;
  storageClass?: StorageClass;
}

export interface CloudflareBuckets {
  [bucketName: string]: CloudflareBucket;
}

export interface BucketsConfig {
  cloudflare?: CloudflareBuckets;
}

export interface CloudflareBucketState {
  location: Region;
  createdAt: string;
  storageClass: StorageClass;
  config: WithBranch<CloudflareBucket>;
}

export interface CloudflareBucketsState {
  [bucketName: string]: CloudflareBucketState;
}

export interface BucketsState {
  cloudflare?: CloudflareBucketsState;
}
