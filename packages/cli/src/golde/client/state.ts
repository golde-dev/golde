import { logger } from "../../logger.ts";
import { GoldeClientBase, GoldeError } from "./base.ts";
import type { StateConfig } from "../../state/types.ts";
import type { Lock } from "../../types/lock.ts";
import type { Change } from "../../types/plan.ts";
import type { State } from "../../types/state.ts";
import type { AbstractStateClient } from "../../types/state.ts";
import type { SavedResource } from "../../types/dependencies.ts";
import { resourcesToState } from "@/utils/state.ts";

export class StateClient extends GoldeClientBase implements AbstractStateClient {
  public async getBranchResources(project: string, branch: string): Promise<SavedResource[]> {
    logger.debug("[Golde] fetching branch resources", { project, branch });

    try {
      const query = new URLSearchParams({ branch }).toString();
      const resources = await this.makeRequest<SavedResource[]>(
        `/projects/${project}/resources?${query}`,
        "GET",
      );
      return resources;
    } catch (error) {
      if (error instanceof Error) {
        logger.error("[Golde] Failed to fetch resources", error.message);
      }
      throw error;
    }
  }

  public async getResources(project: string, resources: string[]): Promise<SavedResource[]> {
    logger.debug("[Golde] fetching resources", { project, resources });
    try {
      const result = await this.makeRequest<SavedResource[]>(
        `/projects/${project}/resources`,
        "POST",
        { resources },
      );
      return result;
    } catch (error) {
      if (error instanceof Error) {
        logger.error("[Golde] Failed to fetch resources", error.message);
      }
      throw error;
    }
  }

  public async getState(project: string): Promise<State | undefined> {
    logger.debug("[Golde] fetching project state", { project });
    try {
      const resources = await this.makeRequest<SavedResource[]>(
        `/projects/${project}/resources`,
        "GET",
      );
      return resourcesToState(resources);
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("Golde failed to get project state", e.cause);
      }
      throw e;
    }
  }

  public async getBranchState(project: string, branch: string): Promise<State> {
    const query = new URLSearchParams({ branch }).toString();
    logger.debug("[Golde] fetching golde state", { project, branch });
    try {
      const resources = await this.makeRequest<SavedResource[]>(
        `/projects/${project}/resources?${query}`,
        "GET",
      );
      return resourcesToState(resources);
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("Golde failed to get branch state", e.cause);
      }
      throw e;
    }
  }

  public async applyChanges(
    project: string,
    branch: string,
    changes: Change[],
    locks: Lock[],
  ): Promise<State> {
    logger.debug("[Golde] Applying changes to golde state", { project, branch, changes, locks });
    try {
      const { id = 1 } = locks.find((lock) => lock.branch === branch) ?? {};

      const state = await this.makeRequest<State>(
        `/projects/${project}/state`,
        "PATCH",
        {
          branch,
          changes,
          lock: id,
        },
      );
      return state;
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("Golde failed to apply changes", e.cause);
      }
      throw e;
    }
  }

  public async createLock(
    project: string,
    branch: string,
    resources: string[] = [],
  ): Promise<Lock> {
    logger.debug("[Golde] creating branch lock", { project, branch });
    try {
      const result = await this.makeRequest<Lock>(
        `/projects/${project}/lock`,
        "POST",
        { branch, resources },
      );
      return result;
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("Golde failed to create branch lock", e.cause);
      }
      throw e;
    }
  }

  public async getLocks(project: string, branch: string): Promise<Lock[]> {
    const query = new URLSearchParams({ branch }).toString();

    logger.debug("[Golde] fetching state lock", { project, branch });
    try {
      const result = await this.makeRequest<Lock[]>(
        `/projects/${project}/lock?${query}`,
        "GET",
      );
      return result;
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("Golde failed to get state lock", e.cause);
      }
      throw e;
    }
  }

  public async getStateConfig(
    project: string,
  ): Promise<StateConfig | undefined> {
    logger.debug("[Golde] fetching state config", { project });
    try {
      const result = await this.makeRequest<StateConfig | undefined>(
        `/projects/${project}/state-config`,
      );
      return result;
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("Golde failed to get state config", e.cause);
      }
      throw e;
    }
  }

  /**
   * If user use custom state provider we need to register with golde
   * Golde need to know how to access state of project
   */
  public async changeStateConfig(
    project: string,
    stateConfig: StateConfig,
  ): Promise<void> {
    logger.debug("[Golde] changing state config", { project, stateConfig });
    try {
      await this.makeRequest(
        `/projects/${project}/state-config`,
        "PUT",
        stateConfig,
      );
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("Golde failed to change state config", e.cause);
      }
      throw e;
    }
  }
}
