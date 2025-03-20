import { crypto } from "jsr:@std/crypto";
import { encodeBase64Url } from "@std/encoding";

/**
 * Create a SHA-512 hash of a byte array and return base64-safe encoded string
 */
export async function hashByteArray(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  return encodeBase64Url(hashBuffer);
}
