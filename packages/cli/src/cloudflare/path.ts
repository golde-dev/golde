import { matchR2Bucket } from "./r2Bucket/path.ts";

export function matchCloudflarePath(path: string): [string, string, string | null] | undefined {
  if (!path.startsWith("cloudflare.")) {
    return;
  }

  const match = matchR2Bucket(path);

  if (!match) {
    throw new Error(`Unable to match Cloudflare path: ${path}`);
  }
  return match;
}
