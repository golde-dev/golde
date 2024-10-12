import { CloudflareClient } from "../clients/cloudflare.ts";
import { logger } from "../logger.ts";

export interface CloudflareConfig {
  apiToken: string;
  accountId: string;
}

export async function createCloudflareClient(
  { apiToken, accountId }: CloudflareConfig,
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
