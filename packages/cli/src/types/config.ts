import type { AWSConfig, AWSCredentials } from "../aws/types.ts";
import type { CloudflareConfig, CloudflareCredentials } from "../cloudflare/types.ts";
import type { GoldeClientConfig } from "../golde/types.ts";
import type { HCloudCredentials } from "../hcloud/types.ts";
import type { StateConfig } from "../state/types.ts";
import type { Output } from "./output.ts";
import type { SlackCredentials } from "../slack/types.ts";
import type { ResourceDependency } from "./dependencies.ts";
import type { GithubConfig, GithubCredentials } from "../github/types.ts";

export type Tags = Record<string, string>;
export type TagList = string[];

export interface ProvidersConfig {
  /**
   * Golde provider config
   */
  golde?: GoldeClientConfig;
  /**
   * AWS access credentials
   */
  aws?: AWSCredentials;
  /**
   * Cloudflare provider config
   */
  cloudflare?: CloudflareCredentials;

  /**
   * Slack provider config
   */
  slack?: SlackCredentials;

  /**
   * Docker registry credentials
   */
  github?: GithubCredentials;

  /**
   * Hetzner cloud provider config
   */
  hcloud?: HCloudCredentials;
}

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
  /**
   * Config for AWS resources
   */
  aws?: AWSConfig;
  /**
   * Cloudflare resources
   */
  cloudflare?: CloudflareConfig;

  /**
   * Github resources
   */
  github?: GithubConfig;
  output?: Output | Output[];
};

export interface ConfigLock {
  branch: string;
  createdAt: string;
}

export type WithBranch<T extends ResourceConfig> = T & {
  branch: string;
};

export type ResourceConfig = {
  branch?: string;
  branchPattern?: string;
};

export type Versioned = {
  version?: string;
};

export type VersionedResource = ResourceConfig & Versioned;

export type ResourceState<
  S extends object = object,
  C extends ResourceConfig = ResourceConfig,
> = S & {
  config: C;
  rawConfig: C;
  dependsOn: ResourceDependency[];
};

export type VersionedResourceState<
  S extends Versioned = Versioned,
  C extends VersionedResource = VersionedResource,
> = S & {
  config: C;
  rawConfig: C;
  dependsOn: ResourceDependency[];
};

export type OmitExecutionContext<T extends ResourceState> = Omit<T, "rawConfig" | "dependsOn">;
