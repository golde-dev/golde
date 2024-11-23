import { matchD1Database } from "./resources/d1Database/path.ts";
import { matchDNSRecord } from "./resources/dnsRecord/path.ts";
import { matchR2Bucket } from "./resources/r2Bucket/path.ts";

export function matchCloudflarePath(path: string): [string, string, string | null] | undefined {
  if (!path.startsWith("cloudflare.")) {
    return;
  }

  const match = matchR2Bucket(path) ?? matchDNSRecord(path) ?? matchD1Database(path);

  if (!match) {
    throw new Error(`Unable to match Cloudflare path: ${path}`);
  }
  return match;
}
