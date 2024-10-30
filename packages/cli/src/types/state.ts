import type { ArtifactsState } from "../artifacts/types.ts";
import type { BucketsState } from "../buckets/types.ts";
import type { DNSState } from "../dns/types.ts";
import type { Lock } from "./lock.ts";
import type { Changes } from "./plan.ts";

export interface State {
  dns?: DNSState;
  buckets?: BucketsState;
  artifacts?: ArtifactsState;
}

export abstract class AbstractStateClient {
  public abstract getBranchState(project: string, branch: string): Promise<State | undefined>;

  public abstract getState(project: string): Promise<State | undefined>;

  public abstract applyChanges(project: string, branch: string, state: Changes[]): Promise<void>;

  public abstract getStateLock(project: string, branch: string): Promise<Lock[] | undefined>;
}
