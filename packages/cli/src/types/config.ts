import type { BucketsConfig } from "../buckets/types";
import type { DNSConfig } from "../dns/types";
import type { ProvidersConfig } from "../providers/types";
import type { ServersConfig } from "../servers/types";
import type { State } from "./state";

export type Config = {
  name: string
  providers: ProvidersConfig; 
  dns?: DNSConfig;
  buckets?: BucketsConfig;
  servers?: ServersConfig;
};

export interface ConfigState {
  config: Config;
  state: State;
  previous: string | null;
}
export interface ConfigLock {
  branch: string;
  createdAt: string;
}