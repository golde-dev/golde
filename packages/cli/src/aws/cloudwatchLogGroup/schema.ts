import { z } from "zod";
import type { LogGroupConfig } from "./types.ts";
import { implement } from "../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../utils/resource.ts";
import { tagsSchema } from "../../utils/tags.ts";

const retentionInDaysSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(5),
  z.literal(7),
  z.literal(14),
  z.literal(30),
  z.literal(60),
  z.literal(90),
  z.literal(120),
  z.literal(150),
  z.literal(180),
  z.literal(365),
  z.literal(400),
  z.literal(545),
  z.literal(731),
  z.literal(1827),
  z.literal(2192),
  z.literal(2557),
  z.literal(2922),
  z.literal(3288),
  z.literal(3653),
  z.undefined(), // Optional, represents indefinite retention if omitted
]);

export const logGroupSchema = implement<LogGroupConfig>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    tags: tagsSchema,
    retentionInDays: retentionInDaysSchema.optional(),
    region: z.string().optional(),
  })
  .strict()
  .transform(transformBranch);

export const logGroupNameSchema = z
  .string()
  .min(1, { message: "Log group name must be at least 1 character long" })
  .max(512, { message: "Log group name must be at most 512 characters long" })
  .regex(/^[\w./-]+$/, {
    message:
      "Log group name can only contain alphanumeric characters, hyphens, underscores, forward slashes, and periods",
  });

export const cloudwatchLogGroupSchema = z.record(logGroupNameSchema, logGroupSchema);
