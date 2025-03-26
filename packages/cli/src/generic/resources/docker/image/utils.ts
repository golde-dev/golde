import { logger } from "@/logger.ts";
import type { DockerClient } from "../../../client/docker.ts";
import type { ImageConfig } from "./types.ts";
import { memoizeAsync } from "@/utils/memoize.ts";
import type { GitVersion, ImageVersion } from "@/types/version.ts";
import { getGitContextVersion, getGitVersion } from "@/utils/version.ts";
import slugify from "@sindresorhus/slugify";

function prefixImageHash(imageHash: string): string {
  return `ih-sha256-${imageHash}`;
}

async function getVersion(
  imageHash: string,
  context: string,
  version: GitVersion | ImageVersion,
): Promise<string> {
  if (version === "ImageHash") {
    return prefixImageHash(imageHash);
  }
  if (version === "GitHash") {
    return await getGitVersion();
  }
  if (version === "GitContextHash") {
    return await getGitContextVersion(context);
  }
  throw new Error(`Not implemented for this type of version: ${version}`);
}

export const buildImage = memoizeAsync(
  async (
    { client, imageName, image }: {
      imageName: string;
      client: DockerClient;
      image: ImageConfig;
    },
  ) => {
    logger.debug(`[Plan] Building image ${imageName}`, {
      config: image,
    });
    const {
      context = ".",
      version,
      dockerfile = "Dockerfile",
    } = image;

    const imageId = await client.buildImage(imageName, context, dockerfile);
    const versionId = await getVersion(imageId, context, version);

    return await Promise.resolve({
      versionId,
      imageId,
    });
  },
);

export function createVersionTag(branch: string, version: string) {
  return `b.${slugify(branch)}.v.${version}`;
}
