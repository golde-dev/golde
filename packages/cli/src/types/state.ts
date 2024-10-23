import type { ArtifactsState } from "../artifacts/types.ts";
import type { BucketsState } from "../buckets/types.ts";
import type { DNSState } from "../dns/types.ts";
import type { ConfigLock } from "./config.ts";

export interface State {
  dns?: DNSState;
  buckets?: BucketsState;
  artifacts?: ArtifactsState;
}

export abstract class StateClient {
  public abstract getState(project: string, branch: string): Promise<State | undefined>;
  public abstract getStateLock(project: string, branch: string): Promise<ConfigLock | undefined>;
}
