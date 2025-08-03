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
       {
        error,
        region,
        secretAccessKey: "<redacted>",
        accessKeyId: "<redacted>",
      },
      "Failed to initialize aws client, check your credentials",
    );
    throw error;
  }
}
