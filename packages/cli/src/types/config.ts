import type { BucketConfig } from "../buckets/bucket";
import type { DNSConfig } from "../dns/dns";
import type { ProvidersConfig } from "../providers/provider";
import type { ServersConfig } from "../servers/hetzner";
import type { State } from "./state";

export type Config = {
  project: string
  providers: ProvidersConfig; 
  dns?: DNSConfig;
  buckets?: BucketConfig;
  servers?: ServersConfig;
};

export interface ConfigState {
  config?: Config;
  state?: State;
  previous: string | null;
}
export interface ConfigLock {
  branch: string;
  createdAt: string;
}