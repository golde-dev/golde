import type { Region, StorageClass } from "../client/types.ts";
import type { Resource, WithBranch } from "../../types/config.ts";

export interface BucketConfig extends Resource {
  locationHint?: Region;
  storageClass?: StorageClass;
}

export interface R2Config {
  [bucketName: string]: BucketConfig;
}

export interface BucketState {
  location: Region;
  createdAt: string;
  storageClass: StorageClass;
  config: WithBranch<BucketConfig>;
}

export interface R2State {
  [bucketName: string]: BucketState;
}
