import { z } from "zod";
import { implement } from "../utils/zod.ts";
import { serversSchema } from "./resources/servers/schema.ts";
import type { HCloudCredentials, HCloudResourcesConfig } from "./types.ts";

export const hcloudConfigSchema = implement<HCloudResourcesConfig>()
  .with({
    servers: serversSchema.optional(),
  })
  .strict();

export const hcloudCredentialsSchema = implement<HCloudCredentials>()
  .with({
    apiKey: z
      .string()
      .describe(
        "Hetzner API token https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/",
      ),
  })
  .describe("Hetzner provider config")
  .strict();
