import { z } from "zod";
import { implement } from "../../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../../utils/resource.ts";
import { tagsSchema } from "../../../utils/tags.ts";
import type { BucketConfig } from "./types.ts";

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
  .min(3, { message: "S3 Bucket name must be at least 3 characters long" })
  .max(63, { message: "S3 Bucket name must be at most 63 characters long" })
  .regex(
    /^(?!.*\.\.)(?!.*\.-)(?!.*-\.)[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/,
    {
      message: "Invalid S3 bucket name. Ensure it follows S3 naming rules.",
    },
  )
  .refine(
    (name) => !/^\d+\.\d+\.\d+\.\d+$/.test(name),
    {
      message: "Invalid S3 bucket name. Name cannot be formatted like an IP address.",
    },
  );

export const s3BucketSchema = z.record(bucketNameSchema, bucketSchema);
