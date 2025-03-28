import type { ResourceState, VersionedResourceState } from "./config.ts";

export interface ResourceDependency {
  valuePath: string;
  resourcePath: string;
  resourceName: string;
  resourceAttribute: string;
}

export type Resource = {
  path: string;
  state: ResourceState | VersionedResourceState;
};

export type SavedResource = {
  isCurrent?: boolean;
  version?: string;
  path: string;
  createdAt: string;
  updatedAt?: string;
  state: ResourceState | VersionedResourceState;
};
