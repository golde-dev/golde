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
import { resourcesToState } from "@/utils/state.ts";
import { readdirSync } from "node:fs";

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
   * Get all resources for a project
   * For versioned resources only include current
   */
  private getAllResources(): SavedResource[] {
    const files = readdirSync(this.path, { encoding: "utf-8" });
    const allResources: SavedResource[] = [];
    for (const file of files) {
      if (!file.endsWith(".state.json")) {
        continue;
      }
      const path = join(this.path, file);
      const resources = readJSON<SavedResource[]>(path);
      const current = resources.filter((r) => !r.version || r.isCurrent);
      allResources.push(...current);
    }
    return allResources;
  }

  /**
   * Get all resources from all branches
   */
  public async getState(_: string): Promise<State | undefined> {
    const allResources = await this.getAllResources();
    return resourcesToState(allResources);
  }

  /**
   * Get specific saved resources
   */
  public async getResources(_: string, resources: string[]): Promise<SavedResource[]> {
    const allResources = await this.getAllResources();
    return allResources.filter((resource) => resources.includes(resource.path));
  }

  /**
   * Get branch resources
   */
  public async getBranchResources(_: string, branch: string): Promise<SavedResource[]> {
    const path = this.getStatePath(branch);
    if (!existsSync(path)) {
      return [];
    }
    return await readJSON<SavedResource[]>(path);
  }

  /**
   * Get state file path for a branch
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
  private saveResources(branch: string, resources: SavedResource[]): void {
    const path = this.getStatePath(branch);
    writeJSON(path, resources);
  }

  /**
   * Update state by applying changes to state
   */
  public async applyChanges(project: string, branch: string, changes: Change[]): Promise<State> {
    const currentResources = await this.getBranchResources(project, branch);
    const updatedResources = applyChangeSet(currentResources, changes);

    await this.saveResources(branch, updatedResources);
    return resourcesToState(updatedResources);
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
  public async getBranchLocks(_: string, branch: string): Promise<Lock[]> {
    const path = this.getStateLockPath(branch);
    if (!existsSync(path)) {
      return [];
    }
    return await readJSON<Lock[]>(path);
  }
}
