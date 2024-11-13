import { z } from "zod";
import type { BucketConfig } from "./types.ts";
import { implement } from "../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../utils/resource.ts";
import { tagsSchema } from "../../utils/tags.ts";

export const bucketSchema = implement<BucketConfig>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    tags: tagsSchema,
    region: z.string().optional(),
  })
  .strict()
  .transform(transformBranch);

const bucketNameSchema = z
  .string()
  .min(3, { message: "Bucket name must be at least 3 characters long" })
  .max(63, { message: "Bucket name must be at most 63 characters long" })
  .regex(/^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$/, {
    message: "Bucket name must start and end with a lowercase letter or number",
  })
  .regex(/^[^0-9]+|[^0-9]+$/g, { message: "Bucket name must not resemble an IP address" })
  .regex(/^(?!.*\.\.)[a-z0-9\-.]*$/, {
    message: "Bucket name cannot have consecutive periods or uppercase letters or underscores",
  });

export const s3BucketSchema = z.record(bucketNameSchema, bucketSchema);
