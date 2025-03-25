import type { AWSState } from "../aws/types.ts";
import type { CloudflareState } from "../cloudflare/types.ts";
import type { Lock } from "./lock.ts";
import type { GithubState } from "../github/types.ts";
import type { Change } from "./plan.ts";
import type { SavedResource } from "@/types/dependencies.ts";

export interface State {
  aws?: AWSState;
  github?: GithubState;
  cloudflare?: CloudflareState;
}

export abstract class AbstractStateClient {
  public abstract getBranchState(project: string, branch: string): Promise<State | undefined>;

  public abstract getState(project: string): Promise<State | undefined>;

  public abstract getResources(project: string, resources: string[]): Promise<SavedResource[]>;

  public abstract getBranchResources(project: string, branch: string): Promise<SavedResource[]>;

  public abstract getBranchLocks(project: string, branch?: string): Promise<Lock[]>;

  public abstract createLock(
    project: string,
    branch: string,
    resources: string[],
  ): Promise<Lock | undefined>;

  public abstract applyChanges(
    project: string,
    branch: string,
    state: Change[],
    locks: Lock[],
  ): Promise<State>;
}
