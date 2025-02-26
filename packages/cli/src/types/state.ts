import type { AWSState } from "../aws/types.ts";
import type { CloudflareState } from "../cloudflare/types.ts";
import type { Lock } from "./lock.ts";
import type { GithubState } from "../github/types.ts";
import type { Change } from "./plan.ts";

export interface State {
  aws?: AWSState;
  github?: GithubState;
  cloudflare?: CloudflareState;
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
