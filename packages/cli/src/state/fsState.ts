import slugify from "@sindresorhus/slugify";
import { ensureDir, existsSync } from "@std/fs";
import { readJSON, writeJSON } from "../utils/json.ts";
import { applyChangeSet } from "./utils/apply.ts";
import type { AbstractStateClient, State } from "../types/state.ts";
import type { Lock } from "../types/lock.ts";
import type { Change } from "../types/plan.ts";
import type { SavedResource } from "@/types/dependencies.ts";
import { cwd } from "node:process";
import { join } from "node:path";

export class FSStateClient implements AbstractStateClient {
  private readonly path: string;

  public constructor(
    path: string = ".golde",
  ) {
    this.path = join(cwd(), path);
  }

  /**
   * Ensure that state directory exists
   */
  public async ensureLocation() {
    await ensureDir(this.path);
  }

  /**
   * Get state for all branches
   */
  public getState(_: string): Promise<State | undefined> {
    throw new Error("Method not implemented.");
  }

  public getResources(_: string, _resources: string[]): Promise<SavedResource[]> {
    throw new Error("Method not implemented.");
  }

  public getBranchResources(_project: string, _branch: string): Promise<SavedResource[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * Get state path for a branch
   */
  private getStatePath(branch: string) {
    return join(this.path, `${slugify(branch)}.state.json`);
  }

  /**
   * Get current state for a branch
   * Assume that state only belongs to a current project
   */
  public async getBranchState(_: string, branch: string): Promise<State | undefined> {
    const path = this.getStatePath(branch);
    if (!await existsSync(path)) {
      return;
    }
    return readJSON<State>(path);
  }

  /**
   * Save state to file
   */
  private saveState(branch: string, state: State): void {
    const path = this.getStatePath(branch);
    writeJSON(path, state);
  }

  /**
   * Update state by applying changes to state
   */
  public async applyChanges(project: string, branch: string, changes: Change[]): Promise<State> {
    const currentState = await this.getBranchState(project, branch);
    const updatedState = applyChangeSet(currentState, changes);

    await this.saveState(branch, updatedState);
    return updatedState;
  }

  /**
   * Get locks for a branch
   */
  private getStateLockPath(branch: string) {
    return join(this.path, `${slugify(branch)}.lock.json`);
  }

  public createLock(
    _project: string,
    _branch: string,
    _resources: string[],
  ): Promise<Lock | undefined> {
    throw new Error("Method not implemented.");
  }

  /**
   * Get locks for a branch
   */
  public async getLocks(_: string, branch: string): Promise<Lock[]> {
    const path = this.getStateLockPath(branch);
    if (!existsSync(path)) {
      return [];
    }
    return await readJSON<Lock[]>(path);
  }
}
