import type { ResourceState, VersionedResourceState } from "./config.ts";

export interface ResourceDependency {
  statePath: string;
  resolved?: boolean;
  resourcePath: string;
  resourceName: string;
  resourceAttribute: string;
}

export type Resource = { path: string; state: ResourceState | VersionedResourceState };
