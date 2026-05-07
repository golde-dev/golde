import type { ServerConfigs, ServerStates } from "./resources/server/types.ts";

export interface HCloudCredentials {
  /**
   * Hetzner API token
   * @see https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/
   */
  apiKey: string;
}

export interface HCloudResourcesConfig {
  server?: ServerConfigs;
}

export interface HCloudResourcesState {
  server?: ServerStates;
}
