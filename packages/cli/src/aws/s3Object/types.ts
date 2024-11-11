import type { Resource, WithBranch } from "../../types/config.ts";

export interface ObjectConfig extends Resource {
}

export interface S3ObjectConfig {
  [objectName: string]: ObjectConfig;
}

export interface ObjectState {
  createdAt: string;
  arn: string;
  config: WithBranch<ObjectConfig>;
}

export interface S3ObjectState {
  [objectName: string]: ObjectState;
}
