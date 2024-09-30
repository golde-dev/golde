import { z } from "zod";
import type { ZodType } from "zod";
import type { ArtifactsConfig } from "./types.ts";

export const artifactsSchema: ZodType<ArtifactsConfig> = z.object({
  docker: z.record(z.object({
    tags: z.array(z.string()).optional(),
  })).optional(),
  archive: z.record(z.object({
    tags: z.array(z.string()).optional(),
  })).optional(),
}).strict();
