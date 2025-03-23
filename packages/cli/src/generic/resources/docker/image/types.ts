import type { TagList, VersionedResource, WithBranch } from "../../../../types/config.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";
import type { GitVersion, ImageVersion } from "../../../../types/version.ts";

export interface ImageConfig extends VersionedResource {
  /**
   * Define how what is the version of the image.
   * If GitHash or GitContextHash is used, image will be only build if the git hash changes.
   * If ImageHash is used, image will be always rebuild even if the git hash is the same.
   *
   * @default ImageHash
   */
  version: GitVersion | ImageVersion;
  /**
   * An optional identifier used to specify a particular version or variant of the image. If no tag is provided, Docker defaults to latest.
   * @see https://docs.docker.com/reference/cli/docker/image/tag/
   */
  tags?: TagList;
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

export interface ImagesConfig {
  [repository: string]: ImageConfig;
}

export interface ImageState {
  version: string;
  createdAt: string;
  updatedAt?: string;
  dependsOn: ResourceDependency[];
  config: WithBranch<ImageConfig>;
}

export interface ImagesState {
  [repository: string]: {
    current: string;
    versions: {
      [version: string]: ImageState;
    };
  };
}
