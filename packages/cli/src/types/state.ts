import type { BucketsState } from "../buckets/types.ts";
import type { DNSState } from "../dns/types.ts";
import { ConfigLock, ConfigState } from "./config.ts";

export interface State {
  dns?: DNSState;
  buckets?: BucketsState;
}

export interface StateClient {
  getState(project: string): Promise<ConfigState | undefined>;
  getStateLock(project: string): Promise<ConfigLock | undefined>;
}
