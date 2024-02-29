import type { ProvidersConfig } from "./provider";
import type { ZodType} from "zod";
import { z } from "zod";

export const providersSchema: ZodType<ProvidersConfig> = z
  .object({
    cloudflare: z
      .object({
        apiKey: z
          .string()
          .describe("Cloudflare api key https://developers.cloudflare.com/fundamentals/api/get-started/create-token/"),
        accountId: z
          .string()
          .describe("Cloudflare account id https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids"),
      })
      .optional()
      .describe("Cloudflare provider config"),
    hcloud: z
      .object({
        apiKey: z
          .string()
          .describe("Hetzner api key https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/"),
      })
      .optional()
      .describe("Hetzner provider config"),
    deployer: z
      .object({
        apiKey: z
          .string()
          .describe("Deployer api key"),
      })
      .optional()
      .describe("Deployer provider config"),
    state: z
      .object({
        bucket: z
          .string()
          .describe("Name of s3 bucket"),
        region: z
          .string()
          .describe("name of region, use auto for R2"),
        endpoint: z
          .string()
          .describe("s3 endpoint"),
        accessKeyId: z
          .string()
          .describe("access key id"),
        secretAccessKey: z
          .string()
          .describe("s3 access key"),
      })
      .optional()
      .describe("State provider config, only required when not using oss version"),
  })
  .strict()
  .refine(
    data => Boolean(data.deployer ?? data.state),
    "Either deployer or state provider need to be configured"
  );