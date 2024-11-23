import type { D1DatabaseConfig, D1DatabaseState } from "./resources/d1Database/types.ts";
import type { DNSConfig } from "./resources/dnsRecord/types.ts";
import type { DNSState } from "./resources/dnsRecord/types.ts";
import type { R2BucketConfig, R2BucketState } from "./resources/r2Bucket/types.ts";

export interface CloudflareConfig {
  dnsRecord?: DNSConfig;
  r2Bucket?: R2BucketConfig;
  d1Database?: D1DatabaseConfig;
}

export interface CloudflareState {
  dnsRecord?: DNSState;
  r2Bucket?: R2BucketState;
  d1Database?: D1DatabaseState;
}

export interface CloudflareCredentials {
  /**
   * Cloudflare API token
   * @see https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
   */
  apiToken: string;
  /**
   * Cloudflare account id
   * @see https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids
   */
  accountId: string;
}
