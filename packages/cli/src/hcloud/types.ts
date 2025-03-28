import type { ServersConfig, ServersState } from "./resources/servers/types.ts";

export interface HCloudCredentials {
  /**
   * Hetzner API token
   * @see https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/
   */
  apiKey: string;
}
export interface HCloudResourcesConfig {
  servers?: ServersConfig;
}

export interface HCloudResourcesState {
  servers?: ServersState;
}
