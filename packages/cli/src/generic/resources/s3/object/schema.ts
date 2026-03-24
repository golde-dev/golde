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
    maxVersions: z.number().int().min(1).optional(),
    context: z.string().optional(),
    bucketName: z.string(),
  })
  .strict()
  .transform(transformBranch)
  .refine(
    (config) => config.source || config.includes,
    "S3 Object Either source or includes must be defined",
  );


/**
 * Use safe character set for S3 object keys
 * https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
 */
const objectKeySchema = z
  .string()
  .min(1, { message: "S3 object key must not be empty" })
  .max(1024, { message: "S3 object key must be at most 1024 characters" })
  .regex(/^[a-zA-Z0-9!_.*'()\-/]+$/, {
    message: "S3 object key must only contain safe characters (alphanumeric, ! - _ . * ' ( ) /)",
  });

export const s3ObjectSchema = z.record(objectKeySchema, objectConfigSchema);
