import { crypto } from "jsr:@std/crypto";
import { encodeBase64Url } from "@std/encoding";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { walk } from "@std/fs";
import type { Buffer } from "node:buffer";

/**
 * Create a SHA-512 hash of a byte array and return base64-safe encoded string
 */
export async function hashByteArray(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-384", data);
  return encodeBase64Url(hashBuffer);
}

export function getFileHash(path: string): Promise<Buffer> {
  const hash = createHash("sha384");

  return new Promise((resolve, reject) => {
    const stream = createReadStream(path);
    stream.on("data", (data) => {
      hash.update(data);
    });
    stream.on("end", () => {
      const digest = hash.digest();
      resolve(digest);
    });
    stream.on("error", reject);
  });
}

export async function getDirHash(dirPath: string): Promise<Buffer> {
  const walker = walk(dirPath, {
    includeFiles: true,
    includeDirs: false,
    includeSymlinks: false,
  });
  const entries = await Array.fromAsync(
    walker,
    (entry) => entry.path,
  );

  const combinedHash = createHash("sha384");
  const sortedEntries = entries.toSorted();

  for (const path of sortedEntries) {
    combinedHash.update(await getFileHash(path));
  }
  return combinedHash.digest();
}
