import type { Resource, Tags, WithBranch } from "../../types/config.ts";
import type { ResourceDependency } from "../../types/dependencies.ts";

export interface Include {
  from: string;
  to: string;
}

export interface ObjectConfig extends Resource {
  tags?: Tags;
  includes?: Include[];
  source?: string;
  bucketArn: string;
}

export interface S3ObjectConfig {
  [objectName: string]: ObjectConfig;
}

export interface ObjectState {
  createdAt: string;
  updatedAt?: string;
  key: string;
  arn: string;
  dependsOn: ResourceDependency[];
  config: WithBranch<ObjectConfig>;
}

export interface S3ObjectState {
  [objectName: string]: ObjectState;
}
