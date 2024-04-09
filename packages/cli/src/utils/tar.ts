import { existsSync, mkdirSync } from "fs";
import logger from "../logger.js";
import { glob } from "glob";
import { dirname } from "node:path";
import { c } from "tar";
import { execSync } from "child_process";

/**
 * Create tar file for selected dir path
 * Use brotli
 * Find using glob
 */
export const createTar = async(
  searchPaths: string[],
  tarFile: string
) => {
  const paths = await glob(searchPaths);
  logger.debug("Paths included in tar", { paths });

  const dir = dirname(tarFile);
  if (!existsSync(dir)) {
    logger.debug("Dir not exists, creating", { dir });
    mkdirSync(dir, {recursive: true});
  }

  await c({
    file: tarFile,
    brotli: true,
  }, paths);
};


/**
 * Create tar file for selected dir path
 * Use zstd with maximum compression and all cores
 * Find using glob
 */
export const createNativeTar = async(
  searchPaths: string[],
  tarFile: string
) => {
  const paths = await glob(searchPaths);
  logger.debug("Paths included in tar", { paths });
  
  const dir = dirname(tarFile);
  if (!existsSync(dir)) {
    logger.debug("Dir not exists, creating", { dir });
    mkdirSync(dir, {recursive: true});
  }
  execSync(`tar -I "zstd -19 -T0" -cf "${tarFile}" ${paths.join(" ")}`);
};