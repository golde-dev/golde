import type { ZodType} from "zod";
import { z } from "zod";
import type { BucketConfig } from "./bucket";

export const bucketSchema: ZodType<BucketConfig> = z
  .object({
    cloudflare: z
      .record(
        z.object({
          location: z.enum([
            "apac", 
            "eeur", 
            "enam", 
            "weur", 
            "wnam",
          ]).optional(),
        }))
      .optional(),
  })
  .strict();


