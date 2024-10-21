import type { ArtifactsState } from "../artifacts/types.ts";
import type { BucketsState } from "../buckets/types.ts";
import type { DNSState } from "../dns/types.ts";
import type { ConfigLock } from "./config.ts";

export interface State {
  dns?: DNSState;
  buckets?: BucketsState;
  artifacts?: ArtifactsState;
}

export interface StateClient {
  getState(project: string, branch: string): Promise<State | undefined>;
  getStateLock(project: string, branch: string): Promise<ConfigLock | undefined>;
}
