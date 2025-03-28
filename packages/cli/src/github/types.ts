import type { ImagesConfig, ImagesState } from "../generic/resources/docker/image/types.ts";

export interface GithubCredentials {
  /**
   * Github username
   */
  username: string;

  /**
   * Personal access token
   */
  accessToken: string;
}

export interface GithubResourcesConfig {
  registry?: {
    dockerImage?: ImagesConfig;
  };
}

export interface GithubResourcesState {
  registry?: {
    dockerImage?: ImagesState;
  };
}
