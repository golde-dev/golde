import type { BucketConfig } from "../buckets/bucket";
import type { DNSConfig } from "../dns/dns";
import type { ProvidersConfig } from "../providers/provider";
import type { ServersConfig } from "../servers/hetzner";

export type Config = {
  project: string
  providers: ProvidersConfig; 
  dns?: DNSConfig;
  buckets?: BucketConfig;
  servers?: ServersConfig;
};
