import { CloudflareClient } from "./client.ts";
import { logger } from "../../logger.ts";
import type { CloudflareCredentials } from "../types.ts";

export async function createCloudflareClient(
  { apiToken, accountId }: CloudflareCredentials,
): Promise<CloudflareClient> {
  const client = new CloudflareClient(apiToken, accountId);

  try {
    logger.debug("Initializing cloudflare client");
    await client.verifyUserToken();
    return client;
  } catch (error) {
    logger.error(
      "Failed to initialize cloudflare client, check your apiKey and key policy",
      {
        error,
        apiKey: "<redacted>",
      },
    );
    throw error;
  }
}
