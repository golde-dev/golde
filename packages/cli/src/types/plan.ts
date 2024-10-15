// deno-lint-ignore-file no-explicit-any

import type { ResourceConfig, ResourceState } from "./config.ts";

export enum Type {
  Create = "Create",
  Delete = "Delete",
  Update = "Update",
  Migrate = "Migrate",
  Noop = "Noop",
  Skip = "Skip",
}

export interface ExecutionUnit<
  T extends (...args: any[]) => any = (...args: any) => any,
> {
  type: Type;
  executor: T;
  args: Parameters<T>;
  path: string;
  dependencies: string[];
}

export interface MigrationUnit {
  type: Type.Migrate;
  from: string;
  to: string;
  path: string;
}

/**
 * Skip used when there executing on different branch than owner
 */
export interface SkipUnit<
  S extends ResourceState = ResourceState,
  C extends ResourceConfig = ResourceConfig,
> {
  type: Type.Skip;
  path: string;
  config?: C;
  state?: S;
}

/**
 * Used when there is no need to update resource
 */
export interface NoopUnit<
  S extends ResourceState = ResourceState,
  C extends ResourceConfig = ResourceConfig,
> {
  type: Type.Noop;
  path: string;
  config: C;
  state: S;
}

export type Plan = (ExecutionUnit | MigrationUnit | NoopUnit | SkipUnit)[];
