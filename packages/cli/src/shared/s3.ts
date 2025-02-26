import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Logger } from "../logger.ts";

export enum LogCode {
  S3GetObjectError = "S3GetObjectError",
  S3DeleteObjectError = "S3DeleteObjectError",
  S3PutObjectError = "S3CreateObjectError",
  S3HeadBucketError = "S3HeadBucketError",
}

interface S3Options {
  logger: Logger;
  bucket: string;
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

/**
 * S3 Client for any S3 compatible storage example: r2, s3, gcs, cloud storage
 */
export class S3 {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly logger: Logger;

  public constructor(
    { logger, bucket, region, endpoint, accessKeyId, secretAccessKey }: S3Options,
  ) {
    this.logger = logger;
    this.bucket = bucket;
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

  /**
   * Check api access token by doing head on bucket
   */
  public async verifyAccess() {
    const command = new HeadBucketCommand({
      Bucket: this.bucket,
    });
    try {
      await this.client.send(command);
    } catch (error) {
      this.logger.debug(
        "Failed to head bucket",
        {
          type: LogCode.S3HeadBucketError,
          error,
          bucket: this.bucket,
        },
      );
      throw error;
    }
  }

  public async getObject(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    try {
      const response = await this.client.send(command);
      return {
        stream: response.Body?.transformToWebStream(),
        type: response.ContentType,
      };
    } catch (error) {
      this.logger.debug("Failed to get object", {
        type: LogCode.S3GetObjectError,
        error,
        key,
        bucket: this.bucket,
      });
      throw error;
    }
  }
  public async getJSONObject<T extends object>(
    key: string,
  ): Promise<T | undefined> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    try {
      const response = await this.client.send(command);
      const text = await response.Body?.transformToString();
      if (!text) {
        return undefined;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      this.logger.debug(
        "Failed to get object",
        {
          type: LogCode.S3GetObjectError,
          error,
          key,
          bucket: this.bucket,
        },
      );
      throw error;
    }
  }

  public async deleteObject(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    try {
      await this.client.send(command);
    } catch (error) {
      this.logger.debug(
        "Failed to delete object",
        {
          type: LogCode.S3DeleteObjectError,
          error,
          key,
          bucket: this.bucket,
        },
      );
      throw error;
    }
  }

  public async putObject(key: string, body: ReadableStream | string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
    });
    try {
      await this.client.send(command);
    } catch (error) {
      this.logger.debug(
        "Failed to put object",
        {
          type: LogCode.S3PutObjectError,
          error,
          key,
          bucket: this.bucket,
        },
      );
      throw error;
    }
  }

  public async putJSONObject(key: string, object: object) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: JSON.stringify(object, null, 2),
    });
    try {
      await this.client.send(command);
    } catch (error) {
      this.logger.debug(
        "Failed to put object",
        {
          type: LogCode.S3PutObjectError,
          error,
          key,
          bucket: this.bucket,
        },
      );
      throw error;
    }
  }
}
