// deno-lint-ignore-file no-explicit-any

import type { ResourceDependency } from "./dependencies.ts";
import type {
  Resource,
  ResourceState,
  VersionedResource,
  VersionedResourceState,
} from "./config.ts";

export enum Type {
  /**
   * When resource is created
   */
  Create = "Create",

  /**
   * When creating new version of resource
   * Versioned resources only
   */
  CreateVersion = "CreateVersion",

  /**
   * When resource is deleted
   */
  Delete = "Delete",

  /**
   * Deletes the resource version
   * Versioned resources only
   */
  DeleteVersion = "DeleteVersion",

  /**
   * When resource is updated
   */
  Update = "Update",

  /**
   * When resource version is changed
   * Versioned resources only
   */
  ChangeVersion = "ChangeVersion",

  /**
   * When there is no change to resource
   */
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
  dependsOn: ResourceDependency[];
}

export interface CreateVersionUnit<
  C extends VersionedResource = VersionedResource,
  S extends ResourceState = ResourceState,
  T extends (...args: any[]) => Promise<S> = (...args: any) => Promise<S>,
> {
  type: Type.CreateVersion;
  executor: T;
  version: string;
  args: Parameters<T>;
  config: C;
  path: string;
  dependsOn: ResourceDependency[];
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

export interface DeleteVersionUnit<
  S extends ResourceState = ResourceState,
  T extends (...args: any[]) => any = (...args: any) => Promise<void>,
> {
  type: Type.DeleteVersion;
  executor: T;
  version: string;
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
  dependsOn: ResourceDependency[];
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
  dependsOn: ResourceDependency[];
}

/**
 * Used when there is no need to update resource
 */
export interface ChangeVersionUnit<
  C extends VersionedResource = VersionedResource,
  S extends VersionedResourceState = VersionedResourceState,
> {
  type: Type.ChangeVersion;
  path: string;
  version: string;
  config: C;
  state: S;
  dependsOn: ResourceDependency[];
}

export type Unit =
  | CreateUnit
  | CreateVersionUnit
  | UpdateUnit
  | DeleteUnit
  | DeleteVersionUnit
  | NoopUnit
  | ChangeVersionUnit;

export type ExecutionUnit =
  | CreateUnit
  | CreateVersionUnit
  | UpdateUnit
  | DeleteUnit
  | DeleteVersionUnit
  | ChangeVersionUnit;

export type UnitGroups = {
  [Type.Noop]?: NoopUnit[];
  [Type.Create]?: CreateUnit[];
  [Type.CreateVersion]: CreateVersionUnit[];
  [Type.Delete]?: DeleteUnit[];
  [Type.DeleteVersion]?: DeleteVersionUnit[];
  [Type.Update]?: UpdateUnit[];
  [Type.ChangeVersion]?: ChangeVersionUnit[];
};

export type Plan = Unit[];
export type ExecutionPlan = ExecutionUnit[];

export interface CreateResult<
  C extends Resource = Resource,
  S extends ResourceState = ResourceState,
> {
  type: Type.Create;
  path: string;
  state: S;
  config: C;
  executionTime: number;
}

export interface CreateVersionResult<
  C extends Resource = Resource,
  S extends ResourceState = ResourceState,
> {
  type: Type.CreateVersion;
  version: string;
  path: string;
  state: S;
  config: C;
  executionTime: number;
}

export interface UpdateResult<
  C extends Resource = Resource,
  S extends ResourceState = ResourceState,
> {
  type: Type.Update;
  path: string;
  prevState: S;
  state: S;
  config: C;
  executionTime: number;
}

export interface DeleteResult<
  S extends ResourceState = ResourceState,
> {
  type: Type.Delete;
  path: string;
  state: S;
  executionTime: number;
}

export interface DeleteVersionResult<
  S extends ResourceState = ResourceState,
> {
  type: Type.DeleteVersion;
  version: string;
  path: string;
  state: S;
  executionTime: number;
}

export interface ChangeVersionResult<
  S extends ResourceState = ResourceState,
> {
  type: Type.ChangeVersion;
  version: string;
  path: string;
  state: S;
  executionTime: number;
}

export type Change =
  | CreateResult
  | CreateVersionResult
  | UpdateResult
  | DeleteResult
  | DeleteVersionResult
  | ChangeVersionResult;
