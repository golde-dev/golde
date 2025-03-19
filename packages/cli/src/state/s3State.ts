import slugify from "@sindresorhus/slugify";
import { notFoundAsUndefined } from "../generic/client/s3.ts";
import type { S3 } from "../generic/client/s3.ts";
import type { AbstractStateClient } from "../types/state.ts";
import type { State } from "../types/state.ts";
import type { Lock } from "../types/lock.ts";
import type { Change } from "../types/plan.ts";
import { applyChangeSet } from "./utils/apply.ts";
import type { Dependency } from "@/types/dependencies.ts";
import type { StateConfig } from "@/state/types.ts";

const getStateKey = (projectName: string, branch: string) =>
  `/${projectName}/${slugify(branch)}.state.json`;

const getLockKey = (projectName: string, branch: string) =>
  `/${projectName}/${slugify(branch)}.lock.json`;

export class S3StateClient implements AbstractStateClient {
  private readonly s3: S3;

  public constructor(s3: S3) {
    this.s3 = s3;
  }

  public createLock(
    _project: string,
    _branch: string,
    _resources: string[],
  ): Promise<Lock | undefined> {
    return Promise.resolve(undefined);
  }

  public getStateConfig(
    _project: string,
    _branch?: string,
  ): Promise<StateConfig | undefined> {
    throw new Error("Method not implemented.");
  }

  public getLocks(_project: string, _branch?: string): Promise<Lock[]> {
    return Promise.resolve([]);
  }

  public getState(_project: string): Promise<State | undefined> {
    throw new Error("Method not implemented.");
  }

  public getResources(_project: string, _resources: string[]): Promise<Dependency[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * Get state for a branch and project
   */
  public getBranchState(project: string, branch: string): Promise<State | undefined> {
    const stateKey = getStateKey(project, branch);
    return notFoundAsUndefined(this.s3.getJSONObject<State>(stateKey));
  }

  /**
   * Save state for a branch and project
   */
  private async saveState(project: string, branch: string, state: State): Promise<void> {
    const stateKey = getStateKey(project, branch);
    await this.s3.putJSONObject(stateKey, state);
  }

  /**
   * Apply changes to state for a branch and project
   */
  public async applyChanges(project: string, branch: string, state: Change[]): Promise<State> {
    const currentState = await this.getBranchState(branch, project);
    const updatedState = applyChangeSet(currentState, state);

    await this.saveState(branch, project, updatedState);
    return updatedState;
  }

  public getStateLock(project: string, branch: string): Promise<Lock[] | undefined> {
    const lockKey = getLockKey(project, branch);
    return notFoundAsUndefined(this.s3.getJSONObject<Lock[]>(lockKey));
  }
}
