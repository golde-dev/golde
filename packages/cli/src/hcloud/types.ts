import type { ServerConfigs, ServerStates } from "./resources/server/types.ts";
import type { SSHKeyConfigs, SSHKeyStates } from "./resources/sshKey/types.ts";

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
}

export interface HCloudResourcesState {
  server?: ServerStates;
  sshKey?: SSHKeyStates;
}
