import { logger } from "../logger.ts";
import { S3 } from "../clients/s3.ts";
import { S3StateClient } from "./s3State.ts";
import { FSStateClient } from "./fsState.ts";
import type { StateClient } from "../types/state.ts";
import type { S3StateConfig, StateConfig } from "./types.ts";
import type { AWSConfig } from "../providers/aws.ts";

const getAWSCredentials = (
  config: S3StateConfig,
  awsConfig?: AWSConfig,
) => {
  const {
    accessKeyId = awsConfig?.accessKeyId,
    secretAccessKey = awsConfig?.secretAccessKey,
  } = config;

  if (!accessKeyId || !secretAccessKey) {
    logger.error(
      "Missing accessKeyId or secretAccessKey for AWS",
      {
        accessKeyId: "<redacted>",
        secretAccessKey: "<redacted>",
      },
    );
    throw new Error("Missing accessKeyId or secretAccessKey for AWS client");
  }

  return {
    accessKeyId,
    secretAccessKey,
  };
};

export async function createStateClient(
  config: StateConfig,
  awsConfig?: AWSConfig,
): Promise<StateClient> {
  if (config.type === "s3") {
    const {
      bucket,
      region,
      endpoint,
    } = config;

    const credentials = getAWSCredentials(config, awsConfig);

    const s3 = new S3({
      bucket,
      logger,
      region,
      endpoint,
      ...credentials,
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

    const stateClient = new FSStateClient(statePath, lockPath);
    try {
      await stateClient.ensureLocation();
      return stateClient;
    } catch (error) {
      logger.error(
        "Failed to initialize fs state client, check your config",
        {
          error,
          statePath,
          lockPath,
        },
      );
      throw error;
    }
  }

  throw new Error("Unsupported state provider");
}
