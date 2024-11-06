import { z } from "zod";
import type { S3BucketConfig } from "./types.ts";
import { implement } from "../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../utils/resource.ts";
import { tagsSchema } from "../../utils/tags.ts";

export const s3BucketSchema = implement<S3BucketConfig>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    tags: tagsSchema,
    region: z.string().optional(),
  })
  .strict()
  .transform(transformBranch);

export const s3ConfigSchema = z.record(s3BucketSchema);
