import type { Resource, Tags } from "../types/config.ts";

export interface DockerCredentials {
  /**
   * Docker registry url
   */
  registry: string;
  /**
   * Docker username
   */
  username: string;
  /**
   * Docker password
   */
  password: string;
}

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
/**
 * cache?: 'git-project-root' | 'git-context';
 */

export interface ImagesConfig {
  [imageName: string]: ImageConfig;
}

export interface DockerConfig {
  images?: ImagesConfig;
}

export interface ImageState {
  tags: string[];
}

export interface ImagesState {
  [imageName: string]: ImageState;
}

export interface DockerState {
  images?: ImagesState;
}
