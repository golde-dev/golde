import { z } from "zod";
import type { AWSBucket, BucketsConfig, CloudflareBucket } from "./types.ts";
import { implement } from "../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../utils/resource.ts";

export const cloudflareBucketSchema = implement<CloudflareBucket>()
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

export const awsBucketSchema = implement<AWSBucket>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    region: z.string().optional(),
  })
  .strict()
  .transform(transformBranch);

export const bucketSchema = implement<BucketsConfig>().with(
  {
    cloudflare: z.record(cloudflareBucketSchema).optional(),
    aws: z.record(awsBucketSchema).optional(),
  },
)
  .strict();
