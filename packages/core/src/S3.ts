import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Logger } from "pino";
import type { Readable } from "stream";
import { LogCode } from "./constants/logging";

interface S3Options {
  logger: Logger;
  bucket: string
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string
}

export class S3 {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly logger: Logger;

  public constructor({logger, bucket, region, endpoint, accessKeyId, secretAccessKey}: S3Options)  {
    this.logger = logger;
    this.bucket = bucket;
    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
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
    }
    catch (error) {
      this.logger.error({
        type: LogCode.S3GetObjectError,
        error,
        key,
        bucket: this.bucket,
      }, "Failed to get object");
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
    }
    catch (error) {
      this.logger.error({
        type: LogCode.S3DeleteObjectError,
        error,
        key,
        bucket: this.bucket,
      }, "Failed to delete object");
      throw error;
    }
  }
  
  public async  putObject(key: string, body: Readable | string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
    });
    try {
      await this.client.send(command);
    }
    catch (error) {
      this.logger.error({
        type: LogCode.S3PutObjectError,
        error,
        key,
        bucket: this.bucket,
      }, "Failed to put object");
      throw error;
    }
}
}