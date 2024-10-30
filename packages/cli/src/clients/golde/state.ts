import { GoldeClientBase, GoldeError } from "./base.ts";
import type { StateConfig } from "../../state/types.ts";
import type { Lock } from "../../types/lock.ts";
import type { Changes } from "../../types/plan.ts";
import type { State } from "../../types/state.ts";
import type { AbstractStateClient } from "../../types/state.ts";
import { logger } from "../../logger.ts";

export class StateClient extends GoldeClientBase implements AbstractStateClient {
  public getState(_project: string): Promise<State | undefined> {
    throw new Error("Method not implemented.");
  }

  public getBranchState(project: string, branch: string): Promise<State> {
    const query = new URLSearchParams({ branch }).toString();
    logger.debug("Golde fetching golde state", { project, branch });
    try {
      return this.makeRequest<State>(
        `/projects/${project}/state?${query}`,
        "GET",
      );
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("Golde failed to get branch state", e.cause);
      }
      throw e;
    }
  }

  public applyChanges(
    project: string,
    branch: string,
    changes: Changes[],
  ): Promise<void> {
    logger.debug("Golde Applying changes to golde state", { project, branch, changes });
    try {
      return this.makeRequest<void>(
        `/projects/${project}/state`,
        "POST",
        { branch, changes },
      );
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("Golde failed to apply changes", e.cause);
      }
      throw e;
    }
  }

  public getStateLock(project: string, branch: string): Promise<Lock[] | undefined> {
    const query = new URLSearchParams({ branch }).toString();
    logger.debug("Golde fetching state lock", { project, branch });
    try {
      return this.makeRequest<Lock[]>(
        `/projects/${project}/lock?${query}`,
        "GET",
        { branch },
      );
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("Golde failed to get state lock", e.cause);
      }
      throw e;
    }
  }

  public getStateConfig(
    project: string,
  ): Promise<StateConfig | undefined> {
    logger.debug("Golde fetching state config", { project });
    try {
      return this.makeRequest<StateConfig | undefined>(
        `/projects/${project}/state-config`,
      );
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
    logger.debug("Golde changing state config", { project, stateConfig });
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
