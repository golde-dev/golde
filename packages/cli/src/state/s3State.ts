import slugify from "@sindresorhus/slugify";
import { notFoundAsUndefined } from "../shared/s3.ts";
import type { S3 } from "../shared/s3.ts";
import type { AbstractStateClient } from "../types/state.ts";
import type { State } from "../types/state.ts";
import type { Lock } from "../types/lock.ts";
import type { Change } from "../types/plan.ts";
import { applyChangeSet } from "./utils/apply.ts";

const getStateKey = (projectName: string, branch: string) =>
  `/${projectName}/${slugify(branch)}.state.json`;

const getLockKey = (projectName: string, branch: string) =>
  `/${projectName}/${slugify(branch)}.lock.json`;

export class S3StateClient implements AbstractStateClient {
  private readonly s3: S3;

  public constructor(s3: S3) {
    this.s3 = s3;
  }

  public getState(_project: string): Promise<State | undefined> {
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
