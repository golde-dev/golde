import type { Region, StorageClass } from "../../../client/types.ts";
import type { ResourceConfig, WithBranch } from "../../../../types/config.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";

export interface BucketConfig extends ResourceConfig {
  locationHint?: Region;
  storageClass?: StorageClass;
}

export interface R2BucketConfig {
  [bucketName: string]: BucketConfig;
}

export interface BucketState {
  name: string;
  location: Region;
  updatedAt?: string;
  createdAt: string;
  dependsOn: ResourceDependency[];
  config: WithBranch<BucketConfig>;
}

export interface R2BucketState {
  [bucketName: string]: BucketState;
}
