import { HCloudClient } from "../clients/hcloud.ts";
import { logger } from "../logger.ts";

interface HCloudConfig {
  apiKey: string;
}

export async function createHCloudClient(
  { apiKey }: HCloudConfig,
): Promise<HCloudClient> {
  const client = new HCloudClient(apiKey);

  try {
    await client.verifyUserToken();
    return client;
  } catch (error) {
    logger.error(
      "Failed to initialize HCloud provider, check your apiKey and key policy",
      {
        error,
        apiKey: "<redacted>",
      },
    );
    throw error;
  }
}
