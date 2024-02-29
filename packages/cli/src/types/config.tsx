import type { BucketConfig } from "../bucket/bucket";
import type { DNSConfig } from "../dns/dns";
import type { ProvidersConfig } from "../providers/provider";

export type Config = {
  project: string
  providers: ProvidersConfig; 
  dns?: DNSConfig;
  buckets?: BucketConfig;
};
