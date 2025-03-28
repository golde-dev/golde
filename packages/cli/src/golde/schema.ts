import { z } from "zod";
import { implement } from "../utils/zod.ts";
import type { GoldeClientConfig, GoldeResourcesConfig } from "./types.ts";
import { containersSchema } from "@/golde/resources/docker/container/schema.ts";

export const goldeCredentialsSchema = implement<GoldeClientConfig>().with({
  apiKey: z
    .string()
    .describe("Golde api key"),
}).describe("Golde provider config");

export const goldeResourcesConfigSchema = implement<GoldeResourcesConfig>()
  .with({
    docker: z.object({
      container: containersSchema.optional(),
    }).optional(),
  })
  .strict();
