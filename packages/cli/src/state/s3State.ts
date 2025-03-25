import slugify from "@sindresorhus/slugify";
import { notFoundAsUndefined } from "../generic/client/s3.ts";
import { S3 } from "../generic/client/s3.ts";
import type { AbstractStateClient } from "../types/state.ts";
import type { State } from "../types/state.ts";
import type { Lock } from "../types/lock.ts";
import type { Change } from "../types/plan.ts";
import { applyChangeSet } from "./utils/apply.ts";
import type { SavedResource } from "@/types/dependencies.ts";
import { resourcesToState } from "@/utils/state.ts";

const getStateKey = (projectName: string, branch: string) =>
  `/projects/${projectName}/${slugify(branch)}.state.json`;

const getLockKey = (projectName: string, branch: string) =>
  `/projects/${projectName}/${slugify(branch)}.lock.json`;

export interface S3StateConfig {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export class S3StateClient implements AbstractStateClient {
  private readonly s3: S3;
  private readonly bucket: string;
  public constructor(config: S3StateConfig) {
    const {
      bucket,
      region,
      endpoint,
      accessKeyId,
      secretAccessKey,
    } = config;
    this.bucket = bucket;
    this.s3 = new S3({
      region,
      endpoint,
      accessKeyId,
      secretAccessKey,
    }, {
      provider: "State",
      serviceName: "S3",
    });
  }

  public async verifyBucketAccess() {
    await this.s3.verifyAccess(this.bucket);
  }

  /**
   * Get all resources for a project
   * For versioned resources only include current
   */
  private async getAllResources(project: string): Promise<SavedResource[]> {
    const keys = await this.s3.listObjects(this.bucket, `/projects/${project}/`);
    const stateKeys = keys.filter((key) => key.endsWith(".state.json"));

    const allResources: SavedResource[] = [];
    for (const key of stateKeys) {
      const resources = await this.s3.getJSONObject<SavedResource[]>(this.bucket, key);
      const current = resources.filter((r) => !r.version || r.isCurrent);
      allResources.push(...current);
    }

    return allResources;
  }

  /**
   * Get specific resources state
   */
  public async getResources(project: string, resources: string[]): Promise<SavedResource[]> {
    const allResources = await this.getAllResources(project);
    return allResources.filter((resource) => resources.includes(resource.path));
  }

  /**
   * Get state of all branches
   */
  public async getState(project: string): Promise<State | undefined> {
    const allResources = await this.getAllResources(project);
    return resourcesToState(allResources);
  }

  /**
   * Get resources for a branch and project
   */
  public async getBranchResources(project: string, branch: string): Promise<SavedResource[]> {
    const stateKey = getStateKey(project, branch);
    const resources = await notFoundAsUndefined(
      this.s3.getJSONObject<SavedResource[]>(this.bucket, stateKey),
    );
    if (!resources) {
      return [];
    }
    return resources;
  }

  /**
   * Get state for a branch and project
   */
  public async getBranchState(
    project: string,
    branch: string,
  ): Promise<State> {
    const resources = await this.getBranchResources(project, branch);
    return resourcesToState(resources);
  }

  /**
   * Save resources for a branch and project
   */
  private async saveResources(
    project: string,
    branch: string,
    resources: SavedResource[],
  ): Promise<void> {
    const stateKey = getStateKey(project, branch);
    await this.s3.putJSONObject(this.bucket, stateKey, resources);
  }

  /**
   * Apply changes to resources for a branch and project
   */
  public async applyChanges(project: string, branch: string, state: Change[]): Promise<State> {
    const currentResources = await this.getBranchResources(branch, project);
    const updatedResources = applyChangeSet(currentResources, state);

    await this.saveResources(branch, project, updatedResources);
    return resourcesToState(updatedResources);
  }

  public createLock(
    _project: string,
    _branch: string,
    _resources: string[],
  ): Promise<Lock | undefined> {
    return Promise.resolve(undefined);
  }

  /**
   * Get locks for a branch and project
   */
  public async getBranchLocks(project: string, branch: string): Promise<Lock[]> {
    const lockKey = getLockKey(project, branch);
    const locks = await notFoundAsUndefined(this.s3.getJSONObject<Lock[]>(this.bucket, lockKey));
    if (!locks) {
      return [];
    }
    return locks;
  }
}
