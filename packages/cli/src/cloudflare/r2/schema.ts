import { z } from "zod";
import { implement } from "../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../utils/resource.ts";
import type { BucketConfig } from "./types.ts";

export const r2BucketSchema = implement<BucketConfig>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    locationHint: z.enum([
      "apac",
      "eeur",
      "enam",
      "weur",
      "wnam",
    ]).optional(),
    storageClass: z.enum([
      "Standard",
      "InfrequentAccess",
    ]).optional(),
  })
  .strict()
  .transform(transformBranch);

export const r2Schema = z.record(r2BucketSchema);
