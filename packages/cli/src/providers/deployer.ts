import logger from "../logger";
import { DeployerClient } from "../clients/deployer";
import type { Provider } from "./provider";
import type { StateConfig} from "./state";
import type { ConfigState } from "../types/config";
import { openAsBlob } from "fs";

interface DeployerConfig {
  apiKey: string;
}

export class DeployerProvider implements Provider {
  private readonly project: string;
  private readonly client: DeployerClient;

  private constructor(project: string, client: DeployerClient ) {
    this.client = client;
    this.project = project;
  }

  public static async init(project: string, { apiKey }: DeployerConfig): Promise<DeployerProvider> {
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
   * If user use custom state provider we need to register with deployer
   * Deployer need to know how to access state of project
   */
  public async registerStateProvider(stateConfig: StateConfig) {
    await this.client.registerManagedStateConfig(this.project, stateConfig);
  } 

  /**
   * Get previous config for project
   */
  public async getManagedStateConfig(): Promise<StateConfig | undefined> {
    return this.client.getManagedStateConfig(this.project);
  }

  /**
   * Get previous config for project 
   */
  public async getCurrentState(): Promise<ConfigState | undefined> {
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
