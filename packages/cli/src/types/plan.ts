// deno-lint-ignore-file no-explicit-any

import type { ResourceDependency } from "./dependencies.ts";
import type {
  OmitExecutionContext,
  ResourceConfig,
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
   * When resource version is updated
   * @example s3 object tags changed
   */
  UpdateVersion = "UpdateVersion",

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
  C extends ResourceConfig = ResourceConfig,
  S extends ResourceState = ResourceState,
  T extends (...args: any[]) => Promise<OmitExecutionContext<S>> = (
    ...args: any
  ) => Promise<OmitExecutionContext<S>>,
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
  T extends (...args: any[]) => Promise<OmitExecutionContext<S>> = (
    ...args: any
  ) => Promise<OmitExecutionContext<S>>,
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
  dependsOn: ResourceDependency[];
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
  dependsOn: ResourceDependency[];
}

export interface UpdateUnit<
  C extends ResourceConfig = ResourceConfig,
  S extends ResourceState = ResourceState,
  T extends (...args: any[]) => any = (...args: any) => Promise<OmitExecutionContext<S>>,
> {
  type: Type.Update;
  executor: T;
  args: Parameters<T>;
  state: S;
  config: C;
  path: string;
  dependsOn: ResourceDependency[];
}

export interface UpdateVersionUnit<
  C extends ResourceConfig = ResourceConfig,
  S extends ResourceState = ResourceState,
  T extends (...args: any[]) => any = (...args: any) => Promise<OmitExecutionContext<S>>,
> {
  type: Type.UpdateVersion;
  executor: T;
  version: string;
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
  C extends ResourceConfig = ResourceConfig,
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
  prevVersion: string;
  config: C;
  state: S;
  dependsOn: ResourceDependency[];
}

export type Unit =
  | CreateUnit
  | CreateVersionUnit
  | UpdateUnit
  | UpdateVersionUnit
  | DeleteUnit
  | DeleteVersionUnit
  | NoopUnit
  | ChangeVersionUnit;

export type ExecutionUnit =
  | CreateUnit
  | CreateVersionUnit
  | UpdateUnit
  | UpdateVersionUnit
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
  [Type.UpdateVersion]?: UpdateVersionUnit[];
};

export type Plan = Unit[];
export type ExecutionPlan = ExecutionUnit[];

export interface CreateResult<
  C extends ResourceConfig = ResourceConfig,
  S extends ResourceState = ResourceState,
> {
  type: Type.Create;
  path: string;
  state: S;
  config: C;
  executionTime: number;
}

export interface CreateVersionResult<
  C extends ResourceConfig = ResourceConfig,
  S extends ResourceState = ResourceState,
> {
  type: Type.CreateVersion;
  version: string;
  isCurrent: true;
  path: string;
  state: S;
  config: C;
  executionTime: number;
}

export interface UpdateResult<
  C extends ResourceConfig = ResourceConfig,
  S extends ResourceState = ResourceState,
> {
  type: Type.Update;
  path: string;
  prevState: S;
  state: S;
  config: C;
  executionTime: number;
}

export interface UpdateVersionResult<
  C extends ResourceConfig = ResourceConfig,
  S extends ResourceState = ResourceState,
> {
  type: Type.UpdateVersion;
  path: string;
  version: string;
  isCurrent: true;
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
  prevVersion: string;
  isCurrent: true;
  path: string;
  state: S;
  executionTime: number;
}

export type Change =
  | CreateResult
  | CreateVersionResult
  | UpdateResult
  | UpdateVersionResult
  | DeleteResult
  | DeleteVersionResult
  | ChangeVersionResult;

export type ExecutionGroup = {
  [Type.Create]?: CreateResult[];
  [Type.CreateVersion]: CreateVersionResult[];
  [Type.Delete]?: DeleteResult[];
  [Type.DeleteVersion]?: DeleteVersionResult[];
  [Type.Update]?: UpdateResult[];
  [Type.ChangeVersion]?: ChangeVersionResult[];
  [Type.UpdateVersion]?: UpdateVersionResult[];
};
