import { CloudflareClient } from "../clients/cloudflare.ts";
import { logger } from "../logger.ts";

export interface CloudflareConfig {
  /**
   * Cloudflare API token
   * @see https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
   */
  apiToken: string;
  /**
   * Cloudflare account id
   * @see https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids
   */
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
