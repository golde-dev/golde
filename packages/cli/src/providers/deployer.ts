import logger from "../logger";
import { openAsBlob } from "fs";
import { DeployerClient } from "../clients/deployer";
import type { Provider } from "./types";
import type { StateConfig} from "./state";
import type { ConfigState } from "../types/config";

interface DeployerConfig {
  apiKey: string;
}

export const getDeployerConfig = (): DeployerConfig | void => {
  if (!process.env.DEPLOYER_API_KEY) { 
    return;
  }
  return {
    apiKey: process.env.DEPLOYER_API_KEY,
  };
};

export class DeployerProvider implements Provider {
  private readonly project: string;
  private readonly client: DeployerClient;

  private constructor(project: string, client: DeployerClient ) {
    this.client = client;
    this.project = project;
  }

  public static async init(project: string, {apiKey}: DeployerConfig): Promise<DeployerProvider> {
    const client = new DeployerClient(apiKey);

    try {
      await client.verifyUserToken();
      return new DeployerProvider(project, client);
    }
    catch (error) {
      logger.error({
        error,
        apiKey: "<redacted>",
      }, "Failed to initialize deployer provider, check your apiKey");
      throw error;
    }
  }

  /**
   * Create project in deployer
   */
  public async createProject() {
    await this.client.createProject(this.project);
  }

  /**
   * If user use custom state provider we need to register with deployer
   * Deployer need to know how to access state of project
   */
  public async registerStateProvider(stateConfig: StateConfig) {
    await this.client.changeStateConfig(this.project, stateConfig);
  }

  /**
   * Get previous config for project
   */
  public async getManagedStateConfig(): Promise<StateConfig | undefined> {
    return this.client.getStateConfig(this.project);
  }

  /**
   * Get previous config for project 
   */
  public async getState(): Promise<ConfigState | undefined> {
    return this.client.getState(this.project);
  }

  /**
   * Upload artifact via deployer api, using worker storage
   */
  public async uploadArtefact(path: string, key: string): Promise<void> {
    const blob = await openAsBlob(path);
    return this.client.uploadArtifact(this.project, key, blob);
  }
}
