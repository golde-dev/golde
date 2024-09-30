import { logger } from "../logger.ts";
import { GoldeClient } from "../clients/golde.ts";
import type { Provider } from "./types.ts";

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
  private readonly client: GoldeClient;

  private constructor(client: GoldeClient) {
    this.client = client;
  }

  public static async init(
    { apiKey }: GoldeConfig,
  ): Promise<GoldeProvider> {
    const client = new GoldeClient(apiKey);

    try {
      await client.verifyUserToken();
      return new GoldeProvider(client);
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
   * Getter Golde client
   */
  public getClient = () => this.client;

  /**
   * Upload artifact via golde api, using worker storage
   */
  public async uploadArtefact(
    project: string,
    path: string,
    key: string,
  ): Promise<void> {
    const fileBytes = await Deno.readFile(path);
    const blob = new Blob([fileBytes]);

    return this.client.uploadArtifact(project, key, blob);
  }
}
