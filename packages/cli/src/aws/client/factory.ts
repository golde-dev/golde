import { AWSClient } from "./client.ts";
import { logger } from "../../logger.ts";
import type { AWSCredentials } from "../types.ts";

export async function createAWSClient(
  { accessKeyId, secretAccessKey, region }: AWSCredentials,
): Promise<AWSClient> {
  const client = new AWSClient(accessKeyId, secretAccessKey, region);

  try {
    logger.debug("Initializing AWS client");
    await client.verifyCredentials();
    return client;
  } catch (error) {
    logger.error(
      "Failed to initialize aws client, check your credentials",
      {
        error,
        region,
        secretAccessKey: "<redacted>",
        accessKeyId: "<redacted>",
      },
    );
    throw error;
  }
}
