import { logger } from "../logger.ts";
import type { Provider } from "./types.ts";
import { S3 } from "../clients/s3.ts";
import { S3StateClient } from "../clients/s3State.ts";

export interface S3StateConfig {
  type: "s3";
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export class StateProvider implements Provider {
  private readonly stateClient: S3StateClient;

  private constructor(stateClient: S3StateClient) {
    this.stateClient = stateClient;
  }

  public static async init({
    type,
    bucket,
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
  }: S3StateConfig): Promise<StateProvider> {
    if (type === "s3") {
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
        return new StateProvider(stateClient);
      } catch (error) {
        logger.error(
          "Failed to initialize state provider, please verify config",
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

    throw new Error("Unsupported state provider");
  }

  public getClient = () => this.stateClient;
}
