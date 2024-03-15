/* eslint-disable @typescript-eslint/no-explicit-any */

export enum Type {
  Create = "Create",
  Delete = "Delete",
  Update = "Update",
}

export interface ExecutionUnit<T extends (...args: any) => any = (...args: any) => any> {
  type: Type;
  executor: T
  args: Parameters<T>
  path: string;
  dependencies: string[];
}

export type Plan = ExecutionUnit[];