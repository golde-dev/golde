import type { StateConfig } from "../../state/types.ts";
import type { Lock } from "../../types/lock.ts";
import type { State } from "../../types/state.ts";
import type { AbstractStateClient } from "../../types/state.ts";
import { GoldeClientBase, notFoundAsUndefined } from "./base.ts";

export class StateClient extends GoldeClientBase implements AbstractStateClient {
  public getState(project: string, branch: string): Promise<State | undefined> {
    return notFoundAsUndefined(
      this.makeRequest<State>(
        `/projects/${project}/state`,
        "POST",
        { branch },
      ),
    );
  }

  public getStateLock(project: string, branch: string): Promise<Lock[] | undefined> {
    return notFoundAsUndefined(
      this.makeRequest<Lock[]>(
        `/projects/${project}/lock`,
        "POST",
        { branch },
      ),
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
