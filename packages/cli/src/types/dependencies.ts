import type { Resource } from "./config.ts";

export interface External {
  type: "external";
  value: Resource;
}

export interface Internal {
  type: "internal";
  value: Resource;
}

export interface Execution {
  type: "execution";
  value: Resource;
}

export type Dependency =
  | External
  | Internal
  | Execution;

export interface Dependencies {
  [resource: string]: Dependency;
}
