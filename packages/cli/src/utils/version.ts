import { createHash } from "node:crypto";
import { statSync } from "node:fs";
import { createReadStream } from "node:fs";
import { getContextRefHash, getRefHash } from "@/utils/git.ts";

/**
 * How many bytes of hash per bytes of inputs
 * 1 MB = 1 * 1024 * 1024 bits
 */
const bytesPerInputBytes = 200 * 1024 * 1024; // 200 MB

/**
 * Get minimum hash output length based on input length
 * @example 10_000MB -> 50 bytes of hash -> 400bit
 * @example 5_000Mb -> 25 bytes of hash -> 240 bit
 * @example 500MB -> 24 bytes of hash -> 172 bit
 */
export function getOutputLength(inputLength: number) {
  const sizeBasedLength = Math.ceil(inputLength / bytesPerInputBytes);
  return Math.max(sizeBasedLength, 24);
}

/**
 * Prefix with hash type and output length to identify hash type and byte length
 * f - file
 * h - hash
 * @example fh-shake128-24-8f0a6c6f121313213121
 */
const prefixHash = (hash: string, outputLength: number) => `fh-shake128-${outputLength}-${hash}`;

/**
 * Return file hash encoded in base64url with prefix to identify hash type and byte length
 * Variable hash length, at minimum use 24 bytes(170bit) and add add byte 200MB of input
 */
export function getFileHashVersion(path: string): Promise<string> {
  const { size } = statSync(path);

  const outputLength = getOutputLength(size);
  const stream = createReadStream(path);
  const hash = createHash("shake128", {
    outputLength,
  });

  return new Promise((resolve, reject) => {
    stream
      .pipe(hash)
      .setEncoding("hex") // FIXME: base64url is not supported in deno?
      .on("finish", () => {
        const finalHash = hash.read();
        const prefixedHash = prefixHash(finalHash, outputLength);
        resolve(prefixedHash);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Prefix to identify last updated version
 * f - file
 * m - mtime
 * @example fm-1677721600
 */
const prefixLastUpdated = (lastUpdated: number) => `fm-${lastUpdated}`;

/**
 * Get last updated version for a file
 */
export async function getLastUpdatedVersion(path: string) {
  const { mtime } = await Deno.lstat(path);
  if (!mtime) {
    throw new Error(`Failed to get last updated for ${path}`);
  }
  return prefixLastUpdated(mtime.valueOf());
}

/*
  Prefix to identify context ref hash
  g - git
  h - hash
  c - connext
  @example ghc-e15fe48d96db4d22c64e316c68681f1579862b4d
*/
const prefixContextRefHash = (hash: string) => `crh-${hash}`;

/**
 * Get an git hash of subfolder within a git repo
 * Prefix to identify context ref hash
 */
export function getGitContextVersion(context: string) {
  const hash = getContextRefHash(context);
  if (!hash) {
    throw new Error(`Failed to get git context ref hash for ${context}`);
  }
  return prefixContextRefHash(hash);
}

/**
 * Prefix to identify git hash
 * g - git
 * h - hash
 * @example gh-e15fe48d96db4d22c64e316c68681f1579862b4d
 */
const prefixGitHash = (hash: string) => `gh-${hash}`;

export function getGitVersion() {
  const hash = getRefHash();
  if (!hash) {
    throw new Error(`Failed to get git ref hash`);
  }
  return prefixGitHash(hash);
}
