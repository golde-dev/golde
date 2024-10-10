import type { ArtifactsState } from "../artifacts/types.ts";
import type { BucketsState } from "../buckets/types.ts";
import type { DNSState } from "../dns/types.ts";
import type { ConfigLock, ConfigState } from "./config.ts";

export interface State {
  dns?: DNSState;
  buckets?: BucketsState;
  artifacts?: ArtifactsState;
}

export interface StateClient {
  getState(project: string): Promise<ConfigState | undefined>;
  getStateLock(project: string): Promise<ConfigLock | undefined>;
}
