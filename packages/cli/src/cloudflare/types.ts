import type { DNSConfig } from "./dns/types.ts";
import type { DNSState } from "./dns/types.ts";
import type { R2Config, R2State } from "./r2/types.ts";

export interface CloudflareConfig {
  dns?: DNSConfig;
  r2?: R2Config;
}

export interface CloudflareState {
  dns?: DNSState;
  r2?: R2State;
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
