import type { ArtifactsState } from "../artifacts/types.ts";
import type { AWSState } from "../aws/types.ts";
import type { CloudflareState } from "../cloudflare/types.ts";
import type { DockerState } from "../docker/types.ts";
import type { Lock } from "./lock.ts";
import type { Change } from "./plan.ts";

export interface State {
  aws?: AWSState;
  cloudflare?: CloudflareState;
  artifacts?: ArtifactsState;
  docker?: DockerState;
}

export abstract class AbstractStateClient {
  public abstract getBranchState(project: string, branch: string): Promise<State | undefined>;

  public abstract getState(project: string): Promise<State | undefined>;

  public abstract getStateLock(project: string, branch: string): Promise<Lock[] | undefined>;

  public abstract applyChanges(
    project: string,
    branch: string,
    state: Change[],
    locks: Lock[],
  ): Promise<State>;
}
