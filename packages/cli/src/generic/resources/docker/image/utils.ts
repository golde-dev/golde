import { memoize } from "@es-toolkit/es-toolkit";
import type { DockerClient } from "../../../client/docker.ts";
import type { ImageConfig } from "./types.ts";

export const buildImage = memoize(
  (
    { client: _, repositoryName: __, image: ___ }: {
      client: DockerClient;
      repositoryName: string;
      image: ImageConfig;
    },
  ) => {
    return {
      version: "1.0.0",
    };
  },
  {
    getCacheKey: ({ repositoryName, image }) => `${repositoryName}_${JSON.stringify(image)}`,
  },
);
