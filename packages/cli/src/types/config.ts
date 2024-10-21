import type { ArtifactsConfig } from "../artifacts/types.ts";
import type { BucketsConfig } from "../buckets/types.ts";
import type { DNSConfig } from "../dns/types.ts";
import type { ProvidersConfig } from "../providers/types.ts";
import type { ServersConfig } from "../servers/types.ts";
import type { StateConfig } from "../state/types.ts";
import type { State } from "./state.ts";

export type Tags = Record<string, string>;

export type Config = {
  /**
   * Name of project,
   */
  name: string;
  /**
   * Tags that would be attached to all resources
   */
  tags?: Tags;
  providers?: ProvidersConfig;
  state?: StateConfig;
  dns?: DNSConfig;
  buckets?: BucketsConfig;
  servers?: ServersConfig;
  artifacts?: ArtifactsConfig;
};

export interface ConfigState {
  config: Config;
  state: State;
  previous: string | null;
}

export interface ConfigLock {
  branch: string;
  createdAt: string;
}

export type WithBranch<T extends Resource> = T & {
  branch: string;
};

export interface Resource {
  branch?: string;
  branchPattern?: string;
}

export type ResourceState<S extends object = object, C extends Resource = Resource> = S & {
  config: C;
};
