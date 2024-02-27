/* eslint-disable @typescript-eslint/class-methods-use-this */

import logger from "../logger";
import { S3 } from "@tenacify/core";
import type { Provider } from "./provider";
import type { Readable } from "stream";
import type { Config } from "../types/config";

export interface StateConfig {
  bucket: string,
  region: string,
  endpoint: string,
  accessKeyId: string,
  secretAccessKey: string,
}

export class StateProvider implements Provider {
  private readonly s3: S3;

  private constructor(s3: S3) {
    this.s3 = s3;
  }

  public static async init({ bucket, region, endpoint, accessKeyId, secretAccessKey }: StateConfig): Promise<StateProvider> {
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
      return new StateProvider(s3);
    }
    catch (error) {
      logger.error({
        error,
        bucket,
        region,
        endpoint,
        accessKeyId: "<redacted>",
        secretAccessKey: "<redacted>",
      }, "Failed to initialize state provider, please verify config");
      throw error;
    }
  }
  public async putObject(key: string, object: Readable | string) {
    return this.s3.putObject(key, object);
  }

  public async getPreviousConfig(): Promise<Config | undefined> {
    return Promise.resolve(undefined);
  }
}

