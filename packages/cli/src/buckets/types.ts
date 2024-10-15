import type { Region, StorageClass } from "../clients/cloudflare.ts";
import type { ResourceConfig } from "../types/config.ts";

export interface CloudflareBucket extends ResourceConfig {
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
  config: CloudflareBucket;
}

export interface CloudflareBucketsState {
  [bucketName: string]: CloudflareBucketState;
}

export interface BucketsState {
  cloudflare?: CloudflareBucketsState;
}
