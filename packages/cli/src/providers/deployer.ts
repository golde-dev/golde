import { logger } from "../logger.ts";
import { DeployerClient } from "../clients/deployer.ts";
import type { Provider } from "./types.ts";
import type { StateConfig } from "./state.ts";
import type { ConfigState } from "../types/config.ts";

interface DeployerConfig {
  apiKey: string;
}

export const getDeployerConfig = (): DeployerConfig | void => {
  const apiKey = Deno.env.get("DEPLOYER_API_KEY");
  if (apiKey) {
    return {
      apiKey,
    };
  }
};

export class DeployerProvider implements Provider {
  private readonly project: string;
  private readonly client: DeployerClient;

  private constructor(project: string, client: DeployerClient) {
    this.client = client;
    this.project = project;
  }

  public static async init(
    project: string,
    { apiKey }: DeployerConfig,
  ): Promise<DeployerProvider> {
    const client = new DeployerClient(apiKey);

    try {
      await client.verifyUserToken();
      return new DeployerProvider(project, client);
    } catch (error) {
      logger.error(
        "Failed to initialize deployer provider, check your apiKey",
        {
          error,
          apiKey: "<redacted>",
        },
      );
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
  public getManagedStateConfig(): Promise<StateConfig | undefined> {
    return this.client.getStateConfig(this.project);
  }

  /**
   * Get previous config for project
   */
  public getState(): Promise<ConfigState | undefined> {
    return this.client.getState(this.project);
  }

  /**
   * Upload artifact via deployer api, using worker storage
   */
  public async uploadArtefact(path: string, key: string): Promise<void> {
    const fileBytes = await Deno.readFile(path);
    const blob = new Blob([fileBytes]);

    return this.client.uploadArtifact(this.project, key, blob);
  }
}
