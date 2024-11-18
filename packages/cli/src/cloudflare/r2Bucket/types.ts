import type { Region, StorageClass } from "../client/types.ts";
import type { Resource, WithBranch } from "../../types/config.ts";

export interface BucketConfig extends Resource {
  locationHint?: Region;
  storageClass?: StorageClass;
}

export interface R2BucketConfig {
  [bucketName: string]: BucketConfig;
}

export interface BucketState {
  location: Region;
  updatedAt?: string;
  createdAt: string;
  config: WithBranch<BucketConfig>;
}

export interface R2BucketState {
  [bucketName: string]: BucketState;
}
