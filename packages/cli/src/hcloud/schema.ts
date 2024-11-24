import { z } from "zod";
import { implement } from "../utils/zod.ts";
import { serversSchema } from "./resources/servers/schema.ts";
import type { HCloudConfig, HCloudCredentials } from "./types.ts";

export const hcloudConfigSchema = implement<HCloudConfig>()
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
