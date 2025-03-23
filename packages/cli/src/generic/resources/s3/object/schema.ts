import { z } from "zod";
import { branchPatternSchema, branchSchema, transformBranch } from "@/utils/resource.ts";
import { tagsSchema } from "@/utils/tags.ts";
import { implement } from "@/utils/zod.ts";
import type { ObjectConfig } from "@/generic/resources/s3/object/types.ts";

export const includesSchema = z.array(
  z.object({
    from: z.string(),
    to: z.string(),
  }),
);

export const sourceSchema = z.string();

export const identitySchema = z
  .enum([
    "FileHash",
    "GitHash",
    "GitContextHash",
    "LastUpdated",
  ])
  .default("FileHash");

export const objectConfigSchema = implement<ObjectConfig>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    tags: tagsSchema,
    includes: includesSchema.optional(),
    version: identitySchema.optional(),
    source: sourceSchema.optional(),
    context: z.string().optional(),
    bucketName: z.string(),
  })
  .strict()
  .transform(transformBranch)
  .refine(
    (config) => config.source || config.includes,
    "S3 Object Either source or includes must be defined",
  );

export const s3ObjectSchema = z.record(objectConfigSchema);
