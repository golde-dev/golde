import type { Region, StorageClass } from "../clients/cloudflare.ts";
import type { Resource } from "../types/config.ts";

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
  branch: string;
  location: Region;
  createdAt: string;
  storageClass: StorageClass;
}

export interface CloudflareBucketsState {
  [bucketName: string]: CloudflareBucketState;
}

export interface BucketsState {
  cloudflare?: CloudflareBucketsState;
}
