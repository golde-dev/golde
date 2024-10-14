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

export interface SkipUnit<C extends Resource = Resource> {
  type: Type.Skip;
  path: string;
  config?: C;
}

export interface NoopUnit<S extends ResourceState = ResourceState, C extends Resource = Resource> {
  type: Type.Noop;
  path: string;
  config: C;
  state: S;
}

export type Plan = (ExecutionUnit | MigrationUnit | NoopUnit | SkipUnit)[];
