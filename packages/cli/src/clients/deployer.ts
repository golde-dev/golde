import type { StateConfig } from "../providers/state";
import logger from "../logger";
import type { ConfigState } from "../types/config";

interface DeployerErrorCause {
  status: number;
  statusText: string
}

class DeployerError extends Error {
  public cause?: DeployerErrorCause;

  public constructor(message: string, cause?: DeployerErrorCause) {
    super(message, { cause });
  }
}

async function notFoundAsUndefined<T>(promise: Promise<T>): Promise<T | undefined> {
  return promise.catch((error) => {
    if (error instanceof DeployerError) {
      if (error.cause?.status === 404) {
        return undefined;
      }
    }
    throw error;
  });
}

export class DeployerClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://tech-stack.tenacify.localhost/api/v1";

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(path: string, method = "GET", body?: object): Promise<T> {
    const start = Date.now();
    return fetch(`${this.baseUrl}/${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async(r) => {
      if (r.ok) {
        return await r.json() as T;
      }
      throw new DeployerError("Deployer request failed", {
        status: r.status,
        statusText: r.statusText,
      });
    }).finally(() => {
      const end = Date.now();
      logger.debug({ 
        path,
        method,
        body,
        time: end - start,
      }, "Deployer request");
    });
  }

  private async makeFileRequest(path: string, method: "POST", body: FormData): Promise<void> {
    const start = Date.now();
    return fetch(`${this.baseUrl}/${path}`, {
      method,
      body,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    }).then((r) => {
      if (!r.ok) {
        throw new DeployerError("Deployer request failed", {
          status: r.status,
          statusText: r.statusText,
        });
      }
    }).finally(() => {
      const end = Date.now();
      logger.debug({ 
        path,
        method,
        time: end - start,
      }, "Deployer request");
    });
  }

  public async verifyUserToken(): Promise<void> {
    const { status } = await this.makeRequest<{status: string}>("/verify-token");
    if (status !== "active") {
      throw new DeployerError(`Token status is not active: ${status}`);
    }
  }

  public async getState(project: string): Promise<ConfigState | undefined> {
    return notFoundAsUndefined(this.makeRequest<ConfigState>(`/projects/${project}/state`));
  }

  public async getStateLock(project: string): Promise<ConfigState | undefined> {
    return notFoundAsUndefined(this.makeRequest<ConfigState>(`/projects/${project}/lock`));
  }

  public async getStateConfig(project: string): Promise<StateConfig | undefined> {
    return this.makeRequest<StateConfig | undefined>(`/projects/${project}/state-config`);
  }

  public async changeStateConfig(project: string, stateConfig: StateConfig): Promise<void> {
    await this.makeRequest(
      `/projects/${project}/state-config`, 
      "PUT", 
      stateConfig
    );
  }
  
  public async uploadArtifact(project: string, key: string, body: Blob): Promise<void> {
    const form = new FormData();
    form.set("key", key);
    form.set("body", body);

    await this.makeFileRequest(
      `/projects/${project}/artifacts`, 
      "POST", 
      form
    );
  }
}
