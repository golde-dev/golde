import { z } from "zod";
import { implement } from "../utils/zod.ts";
import { route53RecordSchema } from "./resources/route53Record/schema.ts";
import { s3BucketSchema } from "./resources/s3Bucket/schema.ts";
import { s3ObjectSchema } from "./resources/s3Object/schema.ts";
import { iamRoleSchema } from "./resources/iamRole/schema.ts";
import { cloudwatchLogGroupSchema } from "./resources/cloudwatchLogGroup/schema.ts";
import { lambdaFunctionSchema } from "./resources/lambdaFunction/schema.ts";
import { iamUserSchema } from "./resources/iamUser/schema.ts";
import { appRunnerServiceSchema } from "./resources/appRunnerService/schema.ts";
import type { AWSConfig, AWSCredentials } from "./types.ts";

export const awsConfigSchema = implement<AWSConfig>()
  .with({
    appRunnerService: appRunnerServiceSchema.optional(),
    s3Bucket: s3BucketSchema.optional(),
    s3Object: s3ObjectSchema.optional(),
    route53Record: route53RecordSchema.optional(),
    iamUser: iamUserSchema.optional(),
    iamRole: iamRoleSchema.optional(),
    cloudwatchLogGroup: cloudwatchLogGroupSchema.optional(),
    lambdaFunction: lambdaFunctionSchema.optional(),
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
