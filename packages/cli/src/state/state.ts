import { logger } from "../logger.ts";
import { S3 } from "../clients/s3.ts";
import { S3StateClient } from "./s3State.ts";
import { FSStateClient } from "./fsState.ts";
import type { StateClient } from "../types/state.ts";
import type { StateConfig } from "./types.ts";

export async function createStateClient(
  config: StateConfig,
): Promise<StateClient> {
  if (config.type === "s3") {
    const {
      bucket,
      region,
      endpoint,
      accessKeyId,
      secretAccessKey,
    } = config;

    const s3 = new S3({
      bucket,
      logger,
      region,
      endpoint,
      accessKeyId,
      secretAccessKey,
    });
    try {
      await s3.verifyAccess();
      const stateClient = new S3StateClient(s3);
      return stateClient;
    } catch (error) {
      logger.error(
        "Failed to initialize s3 state client, please verify config",
        {
          error,
          bucket,
          region,
          endpoint,
          accessKeyId: "<redacted>",
          secretAccessKey: "<redacted>",
        },
      );
      throw error;
    }
  }

  if (config.type === "fs") {
    const {
      statePath,
      lockPath,
    } = config;

    return new FSStateClient(statePath, lockPath);
  }

  throw new Error("Unsupported state provider");
}
