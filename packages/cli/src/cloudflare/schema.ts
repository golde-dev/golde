import { implement } from "../utils/zod.ts";
import type { CloudflareConfig, CloudflareCredentials } from "./types.ts";
import { r2Schema } from "./resources/r2Bucket/schema.ts";
import { dnsSchema } from "./resources/dnsRecord/schema.ts";
import { z } from "zod";
import { d1DatabaseSchema } from "./resources/d1Database/schema.ts";

export const cloudflareConfigSchema = implement<CloudflareConfig>()
  .with({
    dnsRecord: dnsSchema.optional(),
    r2Bucket: r2Schema.optional(),
    d1Database: d1DatabaseSchema.optional(),
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
  })
  .describe("Cloudflare provider config")
  .strict();
