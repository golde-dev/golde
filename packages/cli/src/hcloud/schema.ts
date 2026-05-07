import { z } from "zod";
import { implement } from "../utils/zod.ts";
import { serversSchema } from "./resources/server/schema.ts";
import type { HCloudCredentials, HCloudResourcesConfig } from "./types.ts";

export const hcloudResourcesConfigSchema = implement<HCloudResourcesConfig>()
  .with({
    server: serversSchema.optional(),
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
