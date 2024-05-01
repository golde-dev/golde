import { existsSync, mkdirSync } from "node:fs";
import { logger } from "../logger.ts";
import { expandGlobSync } from "@std/fs";
import { Tar } from "@std/archive";
import { copy } from "@std/io";
import { dirname } from "node:path";
import { execSync } from "node:child_process";

function glob(searchPaths: string[]) {
  return searchPaths
    .map((s) => expandGlobSync(s))
    .map((walkIter) =>
      Array
        .from(walkIter)
        .map(({ path }) => path)
    )
    .flat();
}

/**
 * Create tar file for selected dir path
 * Find using glob
 */
export const createTar = async (
  searchPaths: string[],
  tarFile: string,
) => {
  const paths = glob(searchPaths);

  logger.debug("Paths included in tar", { paths });

  const dir = dirname(tarFile);
  if (!existsSync(dir)) {
    logger.debug("Dir not exists, creating", { dir });
    mkdirSync(dir, { recursive: true });
  }
  const tar = new Tar();
  for (const path of paths) {
    tar.append(path, { filePath: path });
  }
  const reader = tar.getReader();
  const writer = await Deno.open(tarFile, {
    write: true,
    create: true,
    truncate: true,
  });
  await copy(reader, writer);
};

/**
 * Create tar file for selected dir path
 * Use zstd with maximum compression and all cores
 */
export const createNativeTar = (
  searchPaths: string[],
  tarFile: string,
) => {
  const paths = glob(searchPaths);

  logger.debug("Paths included in tar", { paths });

  const dir = dirname(tarFile);
  if (!existsSync(dir)) {
    logger.debug("Dir not exists, creating", { dir });
    mkdirSync(dir, { recursive: true });
  }
  execSync(`tar -I "zstd -19 -T0" -cf "${tarFile}" ${paths.join(" ")}`);
};
