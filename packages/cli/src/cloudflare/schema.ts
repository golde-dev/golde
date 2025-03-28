import { implement } from "../utils/zod.ts";
import type { CloudflareCredentials, CloudflareResourcesConfig } from "./types.ts";
import { r2BucketsSchema } from "./resources/r2/bucket/schema.ts";
import { s3ObjectSchema } from "@/generic/resources/s3/object/schema.ts";
import { dnsSchema } from "./resources/dns/record/schema.ts";
import { z } from "zod";
import { d1DatabaseSchema } from "./resources/d1/database/schema.ts";

export const cloudflareResourcesConfigSchema = implement<CloudflareResourcesConfig>()
  .with({
    dns: z.object({
      record: dnsSchema.optional(),
    }).optional(),
    r2: z.object({
      bucket: r2BucketsSchema.optional(),
      object: s3ObjectSchema.optional(),
    }).optional(),
    d1: z.object({
      database: d1DatabaseSchema.optional(),
    }).optional(),
  })
  .strict();

export const cloudflareCredentialsSchema = implement<CloudflareCredentials>()
  .with({
    apiToken: z
      .string()
      .describe(
        "Cloudflare api key https://developers.cloudflare.com/fundamentals/api/get-started/create-token/",
      ),
    accountId: z
      .string()
      .describe(
        "Cloudflare account id https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids",
      ),
    s3: z.object({
      endpoint: z
        .string()
        .describe(
          "Cloudflare R2 S3 endpoint https://developers.cloudflare.com/r2/api/s3/tokens/",
        ),
      accessKeyId: z
        .string()
        .describe(
          "Cloudflare R2 S3 access key id https://developers.cloudflare.com/r2/api/s3/tokens/",
        ),
      secretAccessKey: z
        .string()
        .describe(
          "Cloudflare R2 S3 secret access key https://developers.cloudflare.com/r2/api/s3/tokens/",
        ),
    }).optional(),
  })
  .describe("Cloudflare provider config")
  .strict();
