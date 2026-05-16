import type { ResourceConfig, WithBranch } from "../../../types/config.ts";
import type { ResourceDependency } from "../../../types/dependencies.ts";

export type ZoneMode = "primary" | "secondary";

export interface PrimaryNameserverConfig {
  address: string;
  port?: number;
  tsigAlgorithm?: string;
  tsigKey?: string;
}

export interface ZoneConfig extends ResourceConfig {
  /**
   * Primary zones are managed by Hetzner; secondary zones replicate from
   * external primaries listed in `primaryNameservers`.
   */
  mode: ZoneMode;
  /**
   * Default TTL for the zone (60–2147483647).
   */
  ttl?: number;
  /**
   * Required when `mode === "secondary"`; ignored otherwise.
   */
  primaryNameservers?: PrimaryNameserverConfig[];
  labels?: Record<string, string>;
}

export type ZoneConfigs = Record<string, ZoneConfig>;

export interface ZoneState {
  id: number;
  name: string;
  mode: string;
  ttl: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  dependsOn: ResourceDependency[];
  config: WithBranch<ZoneConfig>;
}

export type ZoneStates = Record<string, ZoneState>;
