import type { Tags, VersionedResource, WithBranch } from "../../../../types/config.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";
import type { FileVersion, GitVersion } from "../../../../types/version.ts";

export interface Object {
  path: string;
  version: string;
}

export interface Include {
  from: string;
  to: string;
}

export type Version = FileVersion | GitVersion;

export interface ObjectConfig extends VersionedResource {
  tags?: Tags;
  includes?: Include[];
  version?: Version;
  source?: string;
  context?: string;
  bucketName: string;
}

export interface S3ObjectConfig {
  [objectName: string]: ObjectConfig;
}

export interface ObjectState {
  createdAt: string;
  updatedAt?: string;
  key: string;
  version: string;
  dependsOn: ResourceDependency[];
  config: WithBranch<ObjectConfig>;
}

export interface S3ObjectState {
  [objectName: string]: {
    current: string;
    versions: {
      [version: string]: ObjectState;
    };
  };
}
