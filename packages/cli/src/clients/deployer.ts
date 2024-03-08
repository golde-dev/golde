import type { StateConfig } from "../providers/state";
import logger from "../logger";
import type { ConfigState } from "../types/config";

class DeployerError extends Error {
  public constructor(message: string, cause?: Error) {
    super(message, { cause });
  }
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
      throw new DeployerError(`Deployer request failed with status code ${r.status}`);
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
        throw new DeployerError(`Deployer request failed with status code ${r.status}`);
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

  public async getCurrentState(project: string): Promise<ConfigState | undefined> {
    return this.makeRequest<ConfigState | undefined>(`/state/${project}`);
  }

  public async getManagedStateConfig(project: string): Promise<StateConfig | undefined> {
    return this.makeRequest<StateConfig | undefined>(`/state-config/${project}`);
  }

  public async registerManagedStateConfig(project: string, stateConfig: StateConfig): Promise<void> {
    await this.makeRequest(
      `/state-config/${project}`, 
      "POST", 
      stateConfig
    );
  }
  
  public async uploadArtifact(key: string, body: Blob): Promise<void> {
    const form = new FormData();
    form.set("key", key);
    form.set("body", body);

    await this.makeFileRequest(
      "/artifacts", 
      "POST", 
      form
    );
  }
}
