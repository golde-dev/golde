import slugify from "@sindresorhus/slugify";
import { ensureDir } from "@std/fs";
import { exists } from "@std/fs/exists";
import { dirname, join } from "@std/path";
import { readJSON, writeJSON } from "../utils/fs.ts";
import { applyChanges } from "../apply.ts";
import type { AbstractStateClient, State } from "../types/state.ts";
import type { Lock } from "../types/lock.ts";
import type { Changes } from "../types/plan.ts";

export class FSStateClient implements AbstractStateClient {
  private readonly path: string;

  public constructor(
    path: string = ".golde",
  ) {
    this.path = join(Deno.cwd(), path);
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
    if (!await exists(path)) {
      return;
    }
    return readJSON<State>(path);
  }

  /**
   * Save state to file
   */
  private saveState(branch: string, state: State): Promise<void> {
    const path = this.getStatePath(branch);
    return writeJSON(path, state);
  }

  /**
   * Update state by applying changes to state
   */
  public async applyChanges(project: string, branch: string, result: Changes[]): Promise<void> {
    const currentState = await this.getBranchState(project, branch);
    const updatedState = applyChanges(currentState, result);

    await this.saveState(branch, updatedState);
  }

  /**
   * Get locks for a branch
   */
  private getStateLockPath(branch: string) {
    return join(this.path, `${slugify(branch)}.lock.json`);
  }

  /**
   * Get locks for a branch
   */
  public async getStateLock(_: string, branch: string): Promise<Lock[] | undefined> {
    const path = this.getStateLockPath(branch);
    if (!await exists(path)) {
      return;
    }
    return await readJSON<Lock[]>(path);
  }
}
