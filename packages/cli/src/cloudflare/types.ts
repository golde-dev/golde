import type { DNSConfig } from "./dnsRecord/types.ts";
import type { DNSState } from "./dnsRecord/types.ts";
import type { R2BucketConfig, R2BucketState } from "./r2Bucket/types.ts";

export interface CloudflareConfig {
  dnsRecord?: DNSConfig;
  r2Bucket?: R2BucketConfig;
}

export interface CloudflareState {
  dnsRecord?: DNSState;
  r2Bucket?: R2BucketState;
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
