import { GoldeClientBase } from "./base.ts";
import type { StateConfig } from "../../state/types.ts";
import type { Lock } from "../../types/lock.ts";
import type { Changes } from "../../types/plan.ts";
import type { State } from "../../types/state.ts";
import type { AbstractStateClient } from "../../types/state.ts";

export class StateClient extends GoldeClientBase implements AbstractStateClient {
  public getState(_project: string): Promise<State | undefined> {
    throw new Error("Method not implemented.");
  }

  public getBranchState(project: string, branch: string): Promise<State> {
    const query = new URLSearchParams({ branch }).toString();

    return this.makeRequest<State>(
      `/projects/${project}/state?${query}`,
      "GET",
    );
  }

  public applyChanges(
    project: string,
    branch: string,
    changes: Changes[],
  ): Promise<void> {
    return this.makeRequest<void>(
      `/projects/${project}/state`,
      "POST",
      { branch, changes },
    );
  }

  public getStateLock(project: string, branch: string): Promise<Lock[] | undefined> {
    const query = new URLSearchParams({ branch }).toString();

    return this.makeRequest<Lock[]>(
      `/projects/${project}/lock?${query}`,
      "GET",
      { branch },
    );
  }

  public getStateConfig(
    project: string,
  ): Promise<StateConfig | undefined> {
    return this.makeRequest<StateConfig | undefined>(
      `/projects/${project}/state-config`,
    );
  }

  /**
   * If user use custom state provider we need to register with golde
   * Golde need to know how to access state of project
   */
  public async changeStateConfig(
    project: string,
    stateConfig: StateConfig,
  ): Promise<void> {
    await this.makeRequest(
      `/projects/${project}/state-config`,
      "PUT",
      stateConfig,
    );
  }
}
