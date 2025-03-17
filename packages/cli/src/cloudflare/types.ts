import type { ObjectsConfig, ObjectsState } from "@/generic/resources/s3/object/types.ts";
import type { D1DatabaseConfig, D1DatabaseState } from "./resources/d1/database/types.ts";
import type { DNSConfig } from "./resources/dns/record/types.ts";
import type { DNSState } from "./resources/dns/record/types.ts";
import type { R2BucketConfig, R2BucketState } from "./resources/r2/bucket/types.ts";

export interface CloudflareConfig {
  dns?: {
    record?: DNSConfig;
  };
  r2?: {
    bucket?: R2BucketConfig;
    object?: ObjectsConfig;
  };
  d1?: {
    database?: D1DatabaseConfig;
  };
}

export interface CloudflareState {
  dns?: {
    record?: DNSState;
  };
  r2?: {
    bucket?: R2BucketState;
    object?: ObjectsState;
  };
  d1?: {
    database?: D1DatabaseState;
  };
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
