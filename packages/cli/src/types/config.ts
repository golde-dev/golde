import type { ArtifactsConfig } from "../artifacts/types.ts";
import type { BucketsConfig } from "../buckets/types.ts";
import type { DNSConfig } from "../dns/types.ts";
import type { ProvidersConfig } from "../providers/types.ts";
import type { ServersConfig } from "../servers/types.ts";
import type { StateConfig } from "../state/types.ts";

export type Tags = Record<string, string>;

export type Config = {
  /**
   * Name of project
   * @note Change to project name will result with state becoming detached from project
   */
  name: string;
  /**
   * These would be merged with resource specific tags
   */
  tags?: Tags;
  /**
   * Config for providers (aws, golde, cloudflare, etc)
   */
  providers?: ProvidersConfig;
  /**
   * Config for state management, define how projects state will be stored
   */
  state?: StateConfig;
  dns?: DNSConfig;
  buckets?: BucketsConfig;
  servers?: ServersConfig;
  artifacts?: ArtifactsConfig;
};

export interface ConfigLock {
  branch: string;
  createdAt: string;
}

export type WithBranch<T extends Resource> = T & {
  branch: string;
};

export type Resource = {
  branch?: string;
  branchPattern?: string;
};

export type ResourceState<S extends object = object, C extends Resource = Resource> = S & {
  config: C;
};
