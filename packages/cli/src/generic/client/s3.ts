import {
  DeleteObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { PutObjectCommandInput, Tag } from "@aws-sdk/client-s3";

import { logger } from "../../logger.ts";

interface S3Options {
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function notFoundAsUndefined<T>(
  promise: Promise<T>,
): Promise<T | undefined> {
  return promise.catch((error: unknown) => {
    if (error instanceof NoSuchKey) {
      return undefined;
    }
    throw error;
  });
}

interface S3ProviderOptions {
  provider: string;
  serviceName: string;
}

/**
 * S3 Client for any S3 compatible storage example: r2, s3, gcs, cloud storage
 */
export class S3 {
  private readonly client: S3Client;
  private readonly provider: string;
  private readonly serviceName: string;

  public constructor(
    { region, endpoint, accessKeyId, secretAccessKey }: S3Options,
    { provider, serviceName }: S3ProviderOptions,
  ) {
    this.provider = provider;
    this.serviceName = serviceName;
    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  public getProviderInfo() {
    return {
      provider: this.provider,
      serviceName: this.serviceName,
    };
  }

  public async putS3Object(
    input: PutObjectCommandInput,
  ) {
    try {
      logger.debug(`[${this.provider}] Create ${this.serviceName} object`, {
        Bucket: input.Bucket,
        Key: input.Key,
      });
      const command = new PutObjectCommand(input);
      await this.client.send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`[${this.provider}] Failed to create ${this.serviceName} object`, e);
      }
      throw e;
    }
  }

  public async putS3ObjectTags(
    bucket: string,
    key: string,
    tags: Tag[],
  ) {
    try {
      logger.debug(`[${this.provider}] Update ${this.serviceName} object tags`, {
        bucket,
        key,
        tags,
      });

      const command = new PutObjectTaggingCommand({
        Bucket: bucket,
        Key: key,
        Tagging: {
          TagSet: tags,
        },
      });
      await this.client.send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`[${this.provider}] Failed to update ${this.serviceName} object tags`, e);
      }
      throw e;
    }
  }

  public async checkS3ObjectExists(bucketName: string, key: string): Promise<boolean> {
    try {
      logger.debug(`[${this.provider}] Check ${this.serviceName} object exists`, {
        Bucket: bucketName,
        Key: key,
      });
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (e) {
      if (e instanceof NotFound) {
        return false;
      }
      logger.error(`[${this.provider}] Failed to check ${this.serviceName} object exists`, e);
      throw e;
    }
  }

  public async deleteS3Object(bucketName: string, key: string): Promise<void> {
    try {
      logger.debug(`[${this.provider}] Delete ${this.serviceName} object`, {
        Bucket: bucketName,
        Key: key,
      });
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await this.client.send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`[${this.provider}] Failed to delete ${this.serviceName} object`, e);
      }
      throw e;
    }
  }

  public async putJSONObject(bucket: string, key: string, object: object) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(object, null, 2),
    });
    try {
      await this.client.send(command);
    } catch (error) {
      logger.error(
        `[${this.provider}] Failed to put ${this.serviceName} object`,
        { error },
      );
      throw error;
    }
  }
}
