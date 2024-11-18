import type { Resource, Tags, WithBranch } from "../../types/config.ts";

export interface ObjectConfig extends Resource {
  tags?: Tags;
}

export interface S3ObjectConfig {
  [objectName: string]: ObjectConfig;
}

export interface ObjectState {
  createdAt: string;
  updatedAt?: string;
  key: string;
  arn: string;
  config: WithBranch<ObjectConfig>;
}

export interface S3ObjectState {
  [objectName: string]: ObjectState;
}
