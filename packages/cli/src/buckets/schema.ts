import type { ZodType } from "zod";
import { z } from "zod";
import type { BucketsConfig } from "./types.ts";

export const bucketSchema: ZodType<BucketsConfig> = z
  .object({
    cloudflare: z
      .record(
        z.object({
          locationHint: z.enum([
            "apac",
            "eeur",
            "enam",
            "weur",
            "wnam",
          ]).optional(),
        }),
      )
      .optional(),
  })
  .strict();
