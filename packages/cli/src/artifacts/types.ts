export interface ArtifactsConfig {
  docker?: {
    [image: string]: {
      tags?: string[];
    };
  };
  archive?: {
    [archive: string]: {
      tags?: string[];
    };
  };
}
