import type { StateConfig } from "../state/types.ts";
import { logger } from "../logger.ts";
import type { ConfigLock, ConfigState } from "../types/config.ts";
import type { StateClient } from "../types/state.ts";
import { GOLDE_API_URL } from "../version.ts";

interface GoldeErrorCause {
  status: number;
  statusText: string;
}

export class GoldeError extends Error {
  public override cause?: GoldeErrorCause;

  public constructor(message: string, cause?: GoldeErrorCause) {
    super(message);
    this.cause = cause;
  }
}

function notFoundAsUndefined<T>(
  promise: Promise<T>,
): Promise<T | undefined> {
  return promise.catch((error: unknown) => {
    if (error instanceof GoldeError) {
      if (error.cause?.status === 404) {
        return undefined;
      }
    }
    throw error;
  });
}

export class GoldeClient implements StateClient {
  private readonly apiKey: string;
  private readonly baseUrl = GOLDE_API_URL;

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private makeRequest<T>(
    path: string,
    method = "GET",
    body?: object,
  ): Promise<T> {
    const start = Date.now();
    return fetch(`${this.baseUrl}${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      if (!r.ok) {
        throw new GoldeError("Golde request failed", {
          status: r.status,
          statusText: r.statusText,
        });
      }
      return await r.json() as T;
    }).finally(() => {
      const end = Date.now();
      logger.debug("Golde request", {
        path,
        method,
        body,
        time: end - start,
      });
    });
  }

  private makeFileRequest(
    path: string,
    method: "POST",
    body: FormData,
  ): Promise<void> {
    const start = Date.now();
    return fetch(`${this.baseUrl}/${path}`, {
      method,
      body,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    }).then((r) => {
      if (!r.ok) {
        throw new GoldeError("Golde request failed", {
          status: r.status,
          statusText: r.statusText,
        });
      }
    }).finally(() => {
      const end = Date.now();
      logger.debug("Golde request", {
        path,
        method,
        time: end - start,
      });
    });
  }

  public async verifyUserToken(): Promise<void> {
    const { status } = await this.makeRequest<{ status: string }>(
      "/verify-token",
    );
    if (status !== "active") {
      throw new GoldeError(`Token status is not active: ${status}`);
    }
  }

  public createProject(project: string): Promise<void> {
    return this.makeRequest("/projects", "POST", {
      name: project,
    });
  }

  public getState(project: string): Promise<ConfigState | undefined> {
    return notFoundAsUndefined(
      this.makeRequest<ConfigState>(`/projects/${project}/state`),
    );
  }

  public getStateLock(project: string): Promise<ConfigLock | undefined> {
    return notFoundAsUndefined(
      this.makeRequest<ConfigLock>(`/projects/${project}/lock`),
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

  public async uploadArtifact(
    project: string,
    key: string,
    body: Blob,
  ): Promise<void> {
    const form = new FormData();
    form.set("key", key);
    form.set("body", body);

    await this.makeFileRequest(
      `/projects/${project}/artifacts`,
      "POST",
      form,
    );
  }
}
