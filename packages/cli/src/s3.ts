import {S3} from "@tenacify/core";
import logger from "./logger.js";
import config from "./config.js";

const {
  S3_REGION: region,
  S3_BUCKET: bucket,
  S3_API_KEY: accessKeyId,
  S3_API_SECRET: secretAccessKey,
  S3_ENDPOINT: endpoint,
} = config;

const client = new S3({
  bucket, 
  logger,
  region,
  endpoint,
  accessKeyId,
  secretAccessKey,
});

export default client;