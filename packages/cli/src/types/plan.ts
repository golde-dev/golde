// deno-lint-ignore-file no-explicit-any

import type { Resource, ResourceState } from "./config.ts";

export enum Type {
  Create = "Create",
  Delete = "Delete",
  Update = "Update",
  Migrate = "Migrate",
  Noop = "Noop",
  Skip = "Skip",
}

export interface CreateUnit<
  C extends Resource = Resource,
  S extends ResourceState = ResourceState,
  T extends (...args: any[]) => Promise<S> = (...args: any) => Promise<S>,
> {
  type: Type.Create;
  executor: T;
  args: Parameters<T>;
  config: C;
  path: string;
  dependencies: string[];
}

export interface DeleteUnit<
  S extends ResourceState = ResourceState,
  T extends (...args: any[]) => any = (...args: any) => Promise<void>,
> {
  type: Type.Delete;
  executor: T;
  args: Parameters<T>;
  state: S;
  path: string;
  dependencies: string[];
}

export interface UpdateUnit<
  C extends Resource = Resource,
  S extends ResourceState = ResourceState,
  T extends (...args: any[]) => any = (...args: any) => Promise<void>,
> {
  type: Type.Update;
  executor: T;
  args: Parameters<T>;
  state: S;
  config: C;
  path: string;
  dependencies: string[];
}

/**
 * Used when assets ownership change between git branches
 */
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
  C extends Resource = Resource,
  S extends ResourceState = ResourceState,
> {
  type: Type.Skip;
  path: string;
  config?: C;
  state?: S;
  reason?: string;
}

/**
 * Used when there is no need to update resource
 */
export interface NoopUnit<
  C extends Resource = Resource,
  S extends ResourceState = ResourceState,
> {
  type: Type.Noop;
  path: string;
  config: C;
  state: S;
}

export type ExecutionUnit =
  | CreateUnit
  | UpdateUnit
  | DeleteUnit
  | MigrationUnit
  | NoopUnit
  | SkipUnit;

export type Plan = ExecutionUnit[];
