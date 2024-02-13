import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import logger from "./logger.js";
import type { Readable } from "stream";
import config from "./config.js";
import { LogCode } from "./constants/logging.js";

const {
  S3_REGION: region,
  S3_BUCKET: bucket,
  S3_API_KEY: accessKeyId,
  S3_API_SECRET: secretAccessKey,
  S3_ENDPOINT: endpoint,
} = config;

const client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function getObject(key: string) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  try {
    const response = await client.send(command);
    return {
      stream: response.Body?.transformToWebStream(),
      type: response.ContentType,
    };
  }
  catch (error) {
    logger.error({
      type: LogCode.R2GetObjectError,
      error,
      key,
      bucket,
    }, "Failed to get object");
    throw error;
  }
}

export async function deleteObject(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  try {
    await client.send(command);
  }
  catch (error) {
    logger.error({
      type: LogCode.R2DeleteObjectError,
      error,
      key,
      bucket,
    }, "Failed to delete object");
    throw error;
  }
}

export async function putObject(key: string, body: Readable | string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
  });
  try {
    await client.send(command);
  }
  catch (error) {
    logger.error({
      type: LogCode.R2PutObjectError,
      error,
      key,
      bucket,
    }, "Failed to put object");
    throw error;
  }
}