import { NameCheapClient } from "../clients/nameCheap/namecheap.ts";
import { logger } from "../logger.ts";

interface NameCheapConfig {
  apiKey: string;
  apiUser: string;
}

export async function createNameCheapClient(
  { apiKey, apiUser }: NameCheapConfig,
): Promise<NameCheapClient> {
  const client = new NameCheapClient(apiKey, apiUser);

  try {
    await client.verifyUserToken();
    return client;
  } catch (error) {
    logger.error(
      "Failed to initialize Namecheap client, check your apiKey, apiUser",
      {
        error,
        apiKey: "<redacted>",
      },
    );
    throw error;
  }
}
