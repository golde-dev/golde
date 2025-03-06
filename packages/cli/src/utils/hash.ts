import { crypto } from "jsr:@std/crypto";
import { encodeBase64Url } from "@std/encoding";
import { createHash } from "node:crypto";
import { statSync } from "node:fs";
import { createReadStream } from "node:fs";

/**
 * Create a SHA-512 hash of a byte array and return base64-safe encoded string
 */
export async function hashByteArray(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  return encodeBase64Url(hashBuffer);
}

/**
 * How many bit of hash per bytes of inputs
 * 1 MB = 1 * 1024 * 1024 bits
 */
const bytesPerInputBytes = 1 * 1024 * 1024; // 1 MB

/**
 * Get minimum hash output length based on input length
 */
export function getOutputLength(inputLength: number): number {
  const sizeBasedLength = Math.ceil(inputLength / bytesPerInputBytes);
  return Math.max(sizeBasedLength, 128);
}

/**
 * Create variable length hash of file using shake128
 * At minimum use 128 bytes and add add byte per megabyte of input
 * Return hash encoded in base64url
 */
export function hashFile(path: string): Promise<string> {
  const { size } = statSync(path);

  const stream = createReadStream(path);
  const hash = createHash("shake128", {
    outputLength: getOutputLength(size),
  });

  return new Promise((resolve, reject) => {
    stream
      .pipe(hash)
      .setEncoding("base64url")
      .on("end", () => {
        const result = hash.read();
        resolve(result);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}
