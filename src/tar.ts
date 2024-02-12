import { execSync } from "node:child_process"
import { getBranchName, getCurrentHash } from "./git.js";

/**
 * Create tar file for selected dir path
 * Use zstd with maximum compression and all cores
 */
export const tarArtifacts = (
  artifactsPaths: string[]
) => {
const paths = artifactsPaths.filter(p => !p.includes("*"));
const patternPaths = artifactsPaths.filter(p => p.includes("*"))

const [
  first, 
  ...rest
] = patternPaths

let foundPaths: string[] = [];

if(first) {
  foundPaths = execSync(`
    find -maxdepth 3 -path "${first}" ${rest.map(p => `-or -path "${p}"`).join(" ")} | cut -c3-`
  )
  .toString()
  .trim()
  .split("\n")
}

console.log(`
  Paths included in artefact: 
  ${[...paths, ...foundPaths].map(p => `  ${p}`).join("\n")}
`)

const tarFile = `/tmp/${getBranchName()}.${getCurrentHash()}.tar.zst`

console.time(`Created tar ${tarFile}`)  
execSync(`tar -I "zstd -19 -T0" -cf "${tarFile}" ${paths.join(" ")} ${foundPaths.join(" ")}`)
console.timeEnd(`Created tar ${tarFile}`)

return tarFile;
}