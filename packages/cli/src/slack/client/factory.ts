import { logger } from "../../logger.ts";
import type { SlackCredentials } from "../types.ts";
import { SlackClient } from "./client.ts";

export async function createSlackClient({ apiToken }: SlackCredentials): Promise<SlackClient> {
  const client = new SlackClient(apiToken);

  try {
    await client.verifyToken();
    return client;
  } catch (error) {
    logger.error(
      "Failed to initialize slack client, check your bot token",
      {
        error,
        apiKey: "<redacted>",
      },
    );
    throw error;
  }
}
