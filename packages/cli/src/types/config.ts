import type { BucketsConfig } from "../buckets/types.ts";
import type { DNSConfig } from "../dns/types.ts";
import type { ProvidersConfig } from "../providers/types.ts";
import type { ServersConfig } from "../servers/types.ts";
import type { State } from "./state.ts";

export type Config = {
  name: string;
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
