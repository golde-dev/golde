import type { ResourceConfig, WithBranch } from "../../../types/config.ts";
import type { ResourceDependency } from "../../../types/dependencies.ts";

export interface ServerConfig extends ResourceConfig {
  /**
   * OS image name or numeric id, e.g. "ubuntu-22.04"
   * @see https://docs.hetzner.cloud/#images
   */
  image: string;
  /**
   * Server type, e.g. "cpx11", "cpx21"
   * @see https://docs.hetzner.cloud/#server-types
   */
  serverType: string;
  /**
   * Network location, e.g. "fsn1", "nbg1", "hel1"
   * Mutually exclusive with `datacenter`
   */
  location?: string;
  /**
   * Specific datacenter, e.g. "fsn1-dc14"
   * Mutually exclusive with `location`
   */
  datacenter?: string;
  /**
   * SSH key IDs or names to install on the server
   */
  sshKeys?: string[];
  /**
   * cloud-init user data script
   */
  userData?: string;
  /**
   * Hetzner labels. Note: keys and values must satisfy Hetzner's strict
   * label regex (no `/`, `=`, `:`, etc.) — Golde project `tags` are NOT
   * merged here because they would not validate.
   */
  labels?: Record<string, string>;
  /**
   * Enable public IPv4. Default true.
   */
  enableIpv4?: boolean;
  /**
   * Enable public IPv6. Default true.
   */
  enableIpv6?: boolean;
}

export type ServerConfigs = Record<string, ServerConfig>;

export interface ServerState {
  id: number;
  name: string;
  /**
   * Public IPv4 — undefined when `enableIpv4: false`
   */
  ipv4?: string;
  /**
   * Public IPv6 — undefined when `enableIpv6: false`
   */
  ipv6?: string;
  status: string;
  datacenter: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  dependsOn: ResourceDependency[];
  config: WithBranch<ServerConfig>;
}

export type ServerStates = Record<string, ServerState>;
