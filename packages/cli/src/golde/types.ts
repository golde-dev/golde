import type { ContainersConfig, ContainersState } from "./resources/docker/container/types.ts";

export interface GoldeClientConfig {
  /**
   * Golde API token
   */
  apiKey: string;
}

export interface GoldeResourcesConfig {
  docker?: {
    container?: ContainersConfig;
  };
}

export interface GoldeResourcesState {
  docker?: {
    container?: ContainersState;
  };
}
