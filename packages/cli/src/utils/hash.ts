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
 * This is prefix will help to identify the hash type
 * It would also allow to change hashing algorithm in the future
 *
 * In the future we could experiment with parallel hashing
 * @see SKEIN HASH https://eprint.iacr.org/2010/432.pdf
 */
const prefixHash = (hash: string, outputLength: number) => `fh-shake128-${outputLength}-${hash}`;

/**
 * Create variable length hash of file using shake128
 * At minimum use 24 bytes(170bit) and add add byte 200MB of input
 * Return hash encoded in base64url
 */
export function hashFile(path: string) {
  const { size } = statSync(path);

  const outputLength = getOutputLength(size);
  const stream = createReadStream(path);
  const hash = createHash("shake128", {
    outputLength,
  });

  return new Promise((resolve, reject) => {
    stream
      .pipe(hash)
      .setEncoding("base64url")
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
