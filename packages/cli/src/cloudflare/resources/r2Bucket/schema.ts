import { z } from "zod";
import { implement } from "../../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../../utils/resource.ts";
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

const nameSchema = z
  .string()
  .min(3, { message: "R2 Bucket name must be at least 3 characters long." })
  .max(63, { message: "R2 Bucket name must be at most 63 characters long." })
  .regex(/^[a-z0-9]/, {
    message: "R2 Bucket name must start with a lowercase letter or number.",
  })
  .regex(/[a-z0-9]$/, {
    message: "R2 Bucket name must end with a lowercase letter or number.",
  })
  .regex(/^[a-z0-9-]*$/, {
    message: "R2 Bucket name can only contain lowercase letters, numbers, and hyphens.",
  });

export const r2Schema = z.record(nameSchema, r2BucketSchema);
