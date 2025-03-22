import type { DockerClient } from "../../../client/docker.ts";
import type { ImageConfig } from "./types.ts";
import { memoizeAsync } from "@/utils/memoize.ts";

export const buildImage = memoizeAsync(
  async (
    { client, image }: {
      client: DockerClient;
      image: ImageConfig;
    },
  ) => {
    const { tags = [], context } = image;

    await client.buildImage(context, tags);
    return await Promise.resolve({
      version: "1.0.0",
    });
  },
);
