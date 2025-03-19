import type { ResourceState } from "./config.ts";

export interface ResourceDependency {
  statePath: string;
  resolved?: boolean;
  resourcePath: string;
  resourceName: string;
  resourceAttribute: string;
}

export type Dependency = { path: string; state: ResourceState };
