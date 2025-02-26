import type { Resource, Tags } from "../../../types/config.ts";

export interface ImageConfig extends Resource {
  /**
   * Tags defines a list of tag mappings that must be associated to the build image.
   */
  tags?: Tags;
  /**
   * Labels add metadata to the resulting image.
   */
  labels?: Record<string, string>;
  /**
   *  Defines path to a directory containing a Dockerfile,
   * @default "."
   */
  context?: string;
  /**
   * Sets an alternate Dockerfile
   * @default Dockerfile
   */
  dockerfile?: string;
}

export interface RegistryDockerImagesConfig {
  [repository: string]: ImageConfig;
}

export interface ImageState {
  tags: string[];
}

export interface RegistryDockerImagesState {
  [repository: string]: ImageState;
}
