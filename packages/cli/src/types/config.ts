import type { AWSConfig, AWSCredentials } from "../aws/types.ts";
import type { CloudflareConfig, CloudflareCredentials } from "../cloudflare/types.ts";
import type { GoldeCredentials } from "../golde/types.ts";
import type { HCloudCredentials } from "../hcloud/types.ts";
import type { DockerConfig, DockerCredentials } from "../docker/types.ts";
import type { StateConfig } from "../state/types.ts";
import type { Output } from "./output.ts";
import type { SlackCredentials } from "../slack/types.ts";

export type Tags = Record<string, string>;

export interface ProvidersConfig {
  /**
   * Golde provider config
   */
  golde?: GoldeCredentials;
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
  docker?: DockerCredentials;

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
  aws?: AWSConfig;
  docker?: DockerConfig;
  cloudflare?: CloudflareConfig;
  output?: Output | Output[];
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
