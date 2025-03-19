import { matchD1Database } from "./resources/d1/database/path.ts";
import { matchDNSRecord } from "./resources/dns/record/path.ts";
import { matchR2Bucket } from "./resources/r2/bucket/path.ts";

export function matchCloudflarePath(path: string): [string, string, string] | undefined {
  if (!path.startsWith("cloudflare.")) {
    return;
  }

  const match = matchR2Bucket(path) ?? matchDNSRecord(path) ?? matchD1Database(path);

  if (!match) {
    throw new Error(`Unable to match Cloudflare path: ${path}`);
  }
  return match;
}
