import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { walk } from "@std/fs";
import { subtle } from "node:crypto";
import { Buffer } from "node:buffer";

/**
 * Create a SHA-512 hash of a byte array and return base64-safe encoded string
 */
export async function hashByteArray(data: Uint8Array): Promise<string> {
  const hashBuffer = await subtle.digest("SHA-384", data);
  return Buffer.from(hashBuffer).toString("base64url");
}

export async function getFileHash(path: string): Promise<Buffer> {
  const hash = createHash("sha384");
  const stream = createReadStream(path);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest();
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
