import { logger } from "../../logger.ts";
import type { GoldeCredentials } from "../types.ts";
import { GoldeClient } from "./client.ts";

export const getGoldeConfig = (): GoldeCredentials | void => {
  const apiKey = Deno.env.get("GOLDE_API_KEY");
  if (apiKey) {
    return {
      apiKey,
    };
  }
};

export async function createGoldeClient(
  { apiKey }: GoldeCredentials,
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
