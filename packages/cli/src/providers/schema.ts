import type { ProvidersConfig } from "./types.ts";
import type { ZodType } from "zod";
import { z } from "zod";

export const providersSchema: ZodType<ProvidersConfig> = z
  .object({
    golde: z
      .object({
        apiKey: z
          .string()
          .describe("Golde api key"),
      })
      .optional()
      .describe("Golde provider config"),
    docker: z
      .object({
        registry: z
          .string()
          .describe("Docker registry url"),
        username: z
          .string()
          .describe("Docker registry username"),
        password: z
          .string()
          .describe("Docker registry password"),
      })
      .optional()
      .describe("Docker provider config"),
    cloudflare: z
      .object({
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
      .optional()
      .describe("Cloudflare provider config"),
    namecheap: z
      .object({
        apiKey: z
          .string()
          .describe(
            "Namecheap api keyhttps://www.namecheap.com/support/api/intro/",
          ),
        apiUser: z
          .string()
          .describe("Your Namecheap account username will act as API username"),
      })
      .optional()
      .describe("Hetzner provider config"),
    hcloud: z
      .object({
        apiKey: z
          .string()
          .describe(
            "Hetzner api key https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/",
          ),
      })
      .optional()
      .describe("Hetzner provider config"),
  })
  .strict();
