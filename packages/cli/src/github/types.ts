import type {
  RegistryDockerImagesConfig,
  RegistryDockerImagesState,
} from "./resources/registry/dockerImage/types.ts";

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

export interface GithubConfig {
  registry?: {
    dockerImage?: RegistryDockerImagesConfig;
  };
}

export interface GithubState {
  registry?: {
    dockerImage?: RegistryDockerImagesState;
  };
}
