import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  GetObjectCommandInput,
  GetObjectCommandOutput,
  PutObjectCommandInput,
  Tag,
} from "@aws-sdk/client-s3";

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

  /**
   * Check api access token by doing head on bucket
   */
  public async verifyAccess(bucket: string) {
    const { provider, serviceName } = this.getProviderInfo();
    const command = new HeadBucketCommand({
      Bucket: bucket,
    });
    try {
      await this.client.send(command);
    } catch (error) {
      logger.error(
        `[${provider}] Access verification failed for ${serviceName} bucket`,
        error,
      );
      throw error;
    }
  }

  public async listObjects(bucket: string, prefix: string): Promise<string[]> {
    const command = new ListObjectsCommand({
      Bucket: bucket,
      Prefix: prefix,
    });
    try {
      const response = await this.client.send(command);
      return response.Contents
        ?.filter(({ Key }) => Key)
        ?.map(({ Key }) => Key) as string[] ?? [];
    } catch (error) {
      logger.error(`[${this.provider}] Failed to list ${this.serviceName} objects`, error);
      throw error;
    }
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

  public async getJSONObject<T>(bucket: string, key: string): Promise<T> {
    try {
      logger.debug(`[${this.provider}] Get ${this.serviceName} JSON object`, {
        Bucket: bucket,
        Key: key,
      });
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      const response = await this.client.send<GetObjectCommandInput, GetObjectCommandOutput>(
        command,
      );
      const text = await response.Body?.transformToString();
      if (!text) {
        throw new Error(`Got empty response from object key: ${key}`);
      }
      return JSON.parse(text) as T;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`[${this.provider}] Failed to get ${this.serviceName} JSON object`, e);
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
        `[${this.provider}] Failed to put ${this.serviceName} JSON object`,
        { error },
      );
      throw error;
    }
  }
}
