import type { ServersConfig, ServersState } from "./servers/types.ts";

export interface HCloudConfig {
  servers?: ServersConfig;
}

export interface HCloudState {
  servers?: ServersState;
}

export interface HCloudCredentials {
  /**
   * Hetzner API token
   * @see https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/
   */
  apiKey: string;
}
