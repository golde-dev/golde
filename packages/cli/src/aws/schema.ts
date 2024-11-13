import { z } from "zod";
import { implement } from "../utils/zod.ts";
import { route53ConfigSchema } from "./route53/schema.ts";
import { s3ConfigSchema } from "./s3Bucket/schema.ts";
import type { AWSConfig, AWSCredentials } from "./types.ts";
import { s3ObjectSchema } from "./s3Object/schema.ts";
import { iamRoleSchema } from "./iamRole/schema.ts";

export const awsConfigSchema = implement<AWSConfig>()
  .with({
    s3Bucket: s3ConfigSchema.optional(),
    s3Object: s3ObjectSchema.optional(),
    route53Record: route53ConfigSchema.optional(),
    iamRole: iamRoleSchema.optional(),
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
