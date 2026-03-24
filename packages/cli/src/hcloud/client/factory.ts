import { HCloudClient } from "./client.ts";
import { logger } from "../../logger.ts";
import type { HCloudCredentials } from "../types.ts";

export async function createHCloudClient(
  { apiKey }: HCloudCredentials,
): Promise<HCloudClient> {
  const client = new HCloudClient(apiKey);

  try {
    await client.verifyUserToken();
    return client;
  } catch (error) {
    logger.error(
      {
        error,
        apiKey: "<redacted>",
      },
      "Failed to initialize HCloud provider, check your apiKey and key policy",
    );
    throw error;
  }
}
