import type { ServerConfigs, ServerStates } from "./resources/server/types.ts";
import type { SSHKeyConfigs, SSHKeyStates } from "./resources/sshKey/types.ts";
import type { ZoneConfigs, ZoneStates } from "./resources/zone/types.ts";
import type { DNSConfig, DNSState } from "./resources/dns/record/types.ts";

export interface HCloudCredentials {
  /**
   * Hetzner API token
   * @see https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/
   */
  apiKey: string;
}

export interface HCloudResourcesConfig {
  server?: ServerConfigs;
  sshKey?: SSHKeyConfigs;
  dns?: {
    zone?: ZoneConfigs;
    record?: DNSConfig;
  };
}

export interface HCloudResourcesState {
  server?: ServerStates;
  sshKey?: SSHKeyStates;
  dns?: {
    zone?: ZoneStates;
    record?: DNSState;
  };
}
