import { execSync } from "node:child_process";
import logger from "./logger.js";

/**
 * Create tar file for selected dir path
 * Use zstd with maximum compression and all cores
 * Find folders if search paths include "*"
 */
export const tarPaths = (
  searchPaths: string[],
  tarFile: string
) => {
const paths = searchPaths.filter(p => !p.includes("*"));
const patternPaths = searchPaths.filter(p => p.includes("*"));

const [
  first, 
  ...rest
] = patternPaths;

let foundPaths: string[] = [];

if (first) {
  foundPaths = execSync(`
    find -maxdepth 3 -path "${first}" ${rest.map(p => `-or -path "${p}"`).join(" ")} | cut -c3-`
  )
  .toString()
  .trim()
  .split("\n");
}

logger.debug({
  staticPaths: paths,
  foundPaths,
  searchPaths,
}, "Paths included in tar");

execSync(`tar -I "zstd -19 -T0" -cf "${tarFile}" ${paths.join(" ")} ${foundPaths.join(" ")}`);
};