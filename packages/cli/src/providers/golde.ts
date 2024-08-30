import { logger } from "../logger.ts";
import { GoldeClient } from "../clients/golde.ts";
import type { Provider } from "./types.ts";
import type { StateConfig } from "./state.ts";
import type { ConfigState } from "../types/config.ts";

interface GoldeConfig {
  apiKey: string;
}

export const getGoldeConfig = (): GoldeConfig | void => {
  const apiKey = Deno.env.get("GOLDE_API_KEY");
  if (apiKey) {
    return {
      apiKey,
    };
  }
};

export class GoldeProvider implements Provider {
  private readonly project: string;
  private readonly client: GoldeClient;

  private constructor(project: string, client: GoldeClient) {
    this.client = client;
    this.project = project;
  }

  public static async init(
    project: string,
    { apiKey }: GoldeConfig,
  ): Promise<GoldeProvider> {
    const client = new GoldeClient(apiKey);

    try {
      await client.verifyUserToken();
      return new GoldeProvider(project, client);
    } catch (error) {
      logger.error(
        "Failed to initialize golde provider, check your apiKey",
        {
          error,
          apiKey: "<redacted>",
        },
      );
      throw error;
    }
  }

  /**
   * Create project in golde
   */
  public async createProject() {
    await this.client.createProject(this.project);
  }

  /**
   * If user use custom state provider we need to register with golde
   * Golde need to know how to access state of project
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
   * Upload artifact via golde api, using worker storage
   */
  public async uploadArtefact(path: string, key: string): Promise<void> {
    const fileBytes = await Deno.readFile(path);
    const blob = new Blob([fileBytes]);

    return this.client.uploadArtifact(this.project, key, blob);
  }
}
