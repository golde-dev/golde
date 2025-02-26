import type {
  RegistryDockerImagesConfig,
  RegistryDockerImagesState,
} from "./resources/ghcrDockerImage/types.ts";

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
  registryDockerImage?: RegistryDockerImagesConfig;
}

export interface GithubState {
  registryDockerImage?: RegistryDockerImagesState;
}
