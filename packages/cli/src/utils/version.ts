import { getContextRefHash, getRefHash } from "@/utils/git.ts";
import { getDirHash, getFileHash } from "@/utils/hash.ts";
import { stat } from "node:fs/promises";

/**
 * Prefix with hash type and output length to identify hash type and byte length
 * f - file
 * h - hash
 * @example fh-sha384-OLBgp1GsljhM2TJ-sbHjaiH9txEUvgdDTAzHv2P24donTt6_529l-9Ua0vFImLlb
 */
const prefixFileHash = (hash: string) => `fh-sha384:${hash}`;

/**
 * Return file hash encoded in base64url with prefix to identify hash type and byte length
 * Variable hash length, at minimum use 24 bytes(170bit) and add add byte 200MB of input
 */
export async function getFileHashVersion(path: string): Promise<string> {
  const fileHash = await getFileHash(path);

  const fileHashDigest = fileHash.toString("base64url");
  return prefixFileHash(fileHashDigest);
}

/**
 * Prefix to identify directory hash
 * d - directory
 * h - hash
 * @example dh-sha384-OLBgp1GsljhM2TJ-sbHjaiH9txEUvgdDTAzHv2P24donTt6_529l-9Ua0vFImLlb
 */
const prefixDirHash = (hash: string) => `dh-sha384:${hash}`;

/**
 * Get directory hash version for a directory
 * Prefix to identify directory hash
 */
export async function getDirHashVersion(dirPath: string): Promise<string> {
  const dirHash = await getDirHash(dirPath);

  const dirHashDigest = dirHash.toString("base64url");
  return prefixDirHash(dirHashDigest);
}

/**
 * Prefix to identify last updated version
 * f - file
 * m - mtime
 * @example fm-1677721600
 */
const prefixLastUpdated = (lastUpdated: number) => `fm:${lastUpdated}`;

/**
 * Get last updated version for a file
 */
export async function getLastUpdatedVersion(path: string) {
  const { mtime } = await stat(path);
  return prefixLastUpdated(mtime.valueOf());
}

/*
  Prefix to identify context ref hash
  g - git
  c - context
  h - hash
  @example gch-e15fe48d96db4d22c64e316c68681f1579862b4d
*/
const prefixContextRefHash = (hash: string) => `gch:${hash}`;

/**
 * Get an git hash of subfolder within a git repo
 * Prefix to identify context ref hash
 */
export function getGitContextVersion(context: string) {
  const hash = getContextRefHash(context);
  return prefixContextRefHash(hash);
}

/**
 * Prefix to identify git hash
 * g - git
 * h - hash
 * @example gh-e15fe48d96db4d22c64e316c68681f1579862b4d
 */
const prefixGitHash = (hash: string) => `gh:${hash}`;

export function getGitVersion() {
  const hash = getRefHash();
  if (!hash) {
    throw new Error(`Failed to get git ref hash`);
  }
  return prefixGitHash(hash);
}
