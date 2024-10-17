import { logger } from "../logger.ts";
import { GoldeClient } from "../clients/golde.ts";

export interface GoldeConfig {
  /**
   * Golde API token
   */
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

export async function createGoldeClient(
  { apiKey }: GoldeConfig,
): Promise<GoldeClient> {
  const client = new GoldeClient(apiKey);

  try {
    await client.verifyUserToken();
    return client;
  } catch (error) {
    logger.error(
      "Failed to initialize golde client, check your apiKey",
      {
        error,
        apiKey: "<redacted>",
      },
    );
    throw error;
  }
}

/**
 * Upload artifact via golde api, using worker storage
 */
// public async uploadArtefact(
//   project: string,
//   path: string,
//   key: string,
// ): Promise<void> {
//   const fileBytes = await Deno.readFile(path);
//   const blob = new Blob([fileBytes]);

//   return this.client.uploadArtifact(project, key, blob);
// }
// }
