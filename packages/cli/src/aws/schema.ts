import { z } from "zod";
import { implement } from "../utils/zod.ts";
import { route53ConfigSchema } from "./route53/schema.ts";
import { s3ConfigSchema } from "./s3/schema.ts";
import type { AWSConfig, AWSCredentials } from "./types.ts";

export const awsConfigSchema = implement<AWSConfig>()
  .with({
    s3: s3ConfigSchema.optional(),
    route53: route53ConfigSchema.optional(),
  })
  .strict();

export const awsCredentialsSchema = implement<AWSCredentials>()
  .with({
    accessKeyId: z
      .string()
      .describe("AWS access key id"),
    secretAccessKey: z
      .string()
      .describe("AWS secret access key"),
    region: z
      .string()
      .describe("AWS region to use when managing aws resources")
      .optional(),
  })
  .describe("AWS provider config");
