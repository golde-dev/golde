import { z } from "zod";
import type { BucketsConfig, CloudflareBucket } from "./types.ts";
import { implement } from "../utils/zod.ts";
import { getDefaultBranch } from "../clients/git.ts";

export const cloudflareBucketSchema = implement<CloudflareBucket>().with({
  branch: z.string().default(getDefaultBranch()).optional(),
  branchPattern: z.string().optional(),
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
});

export const bucketSchema = implement<BucketsConfig>().with(
  {
    cloudflare: z.record(cloudflareBucketSchema).optional(),
  },
)
  .strict();
