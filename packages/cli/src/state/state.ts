import { logger } from "../logger.ts";
import { S3 } from "../clients/s3.ts";
import { S3StateClient } from "./s3State.ts";
import { FSStateClient } from "./fsState.ts";
import type { AbstractStateClient } from "../types/state.ts";
import type { S3StateConfig, StateConfig } from "./types.ts";
import type { AWSCredentials } from "../aws/types.ts";

const getAWSCredentials = (
  config: S3StateConfig,
  awsConfig?: AWSCredentials,
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
  awsConfig?: AWSCredentials,
): Promise<AbstractStateClient> {
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
      path,
    } = config;

    const stateClient = new FSStateClient(path);
    try {
      await stateClient.ensureLocation();
      return stateClient;
    } catch (error) {
      logger.error(
        "Failed to initialize fs state client, check your config",
        {
          error,
          path,
        },
      );
      throw error;
    }
  }

  throw new Error("Unsupported state provider");
}
