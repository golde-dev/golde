// deno-lint-ignore-file no-explicit-any

import type { Resource, ResourceState } from "./config.ts";

export enum Type {
  Create = "Create",
  Delete = "Delete",
  Update = "Update",
  Noop = "Noop",
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
  dependsOn: string[];
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
}

export interface UpdateUnit<
  C extends Resource = Resource,
  S extends ResourceState = ResourceState,
  T extends (...args: any[]) => any = (...args: any) => Promise<S>,
> {
  type: Type.Update;
  executor: T;
  args: Parameters<T>;
  state: S;
  config: C;
  path: string;
  dependsOn: string[];
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
  | NoopUnit;

export type ExecutionGroups = {
  [Type.Noop]?: NoopUnit[];
  [Type.Create]?: CreateUnit[];
  [Type.Delete]?: DeleteUnit[];
  [Type.Update]?: UpdateUnit[];
};

export type Plan = ExecutionUnit[];
