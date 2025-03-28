import { z } from "zod";
import { implement } from "../utils/zod.ts";
import { route53RecordSchema } from "./resources/route53/record/schema.ts";
import { s3BucketSchema } from "./resources/s3/bucket/schema.ts";
import { s3ObjectSchema } from "../generic/resources/s3/object/schema.ts";
import { iamRoleSchema } from "./resources/iam/role/schema.ts";
import { cloudwatchLogGroupSchema } from "./resources/cloudwatch/logGroup/schema.ts";
import { lambdaFunctionSchema } from "./resources/lambda/function/schema.ts";
import { iamUserSchema } from "./resources/iam/user/schema.ts";
import { appRunnerServiceSchema } from "./resources/appRunner/service/schema.ts";
import type { AWSCredentials, AWSResourcesConfig } from "./types.ts";

export const awsResourcesConfigSchema = implement<AWSResourcesConfig>()
  .with({
    appRunner: z.object({
      service: appRunnerServiceSchema.optional(),
    }).optional(),
    s3: z.object({
      bucket: s3BucketSchema.optional(),
      object: s3ObjectSchema.optional(),
    }).optional(),
    route53: z.object({
      record: route53RecordSchema.optional(),
    }).optional(),
    iam: z.object({
      user: iamUserSchema.optional(),
      role: iamRoleSchema.optional(),
    }).optional(),
    cloudwatch: z.object({
      logGroup: cloudwatchLogGroupSchema.optional(),
    }).optional(),
    lambda: z.object({
      function: lambdaFunctionSchema.optional(),
    }).optional(),
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
