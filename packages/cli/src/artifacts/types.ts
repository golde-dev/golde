export interface DockerImage {
  /**
   * Pattern of related git branch
   */
  branchPattern?: string;
  /**
   * Name of related git branch
   */
  branch?: string;
  /**
   * Tags defines a list of tag mappings that must be associated to the build image.
   */
  tags?: string[];
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

export interface DockerImages {
  [imageName: string]: DockerImage;
}

export interface Archive {
  /**
   * Pattern of related git branch
   */
  branchPattern?: string;
  /**
   * Name of related git branch
   */
  branch?: string;
  /**
   *  Defines path to a directory to archive
   * @default "."
   */
  context?: string;
}

export interface Archives {
  [archiveName: string]: Archive;
}

export interface ArtifactsConfig {
  docker?: DockerImages;
  archive?: Archives;
}

export interface DockerImageState {
  tags: string[];
}

export interface DockerImagesState {
  [imageName: string]: DockerImageState;
}

export interface ArchiveState {
  uri: string;
}

export interface ArchivesState {
  [archiveName: string]: ArchiveState;
}

export interface ArtifactsState {
  docker?: DockerImagesState;
  archive?: ArchivesState;
}
