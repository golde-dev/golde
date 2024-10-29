import { z, type ZodType } from "zod";
import { implement } from "../utils/zod.ts";
import type { FSStateConfig, S3StateConfig, StateConfig } from "./types.ts";

export const s3stateSchema = implement<S3StateConfig>().with({
  type: z
    .literal("s3")
    .describe(
      "Type of state backend for s3 backed state",
    ),
  bucket: z
    .string()
    .describe("Name of s3 bucket"),
  region: z
    .string()
    .describe("name of region, use auto for R2"),
  endpoint: z
    .string()
    .describe("s3 endpoint"),
  accessKeyId: z
    .string()
    .describe("access key id").optional(),
  secretAccessKey: z
    .string()
    .describe("s3 access key").optional(),
});

export const fsStateSchema = implement<FSStateConfig>().with({
  type: z
    .literal("fs")
    .describe(
      "Type of state backend",
    ),
  path: z
    .string()
    .optional()
    .describe("relative path to lock file"),
});

export const stateSchema: ZodType<StateConfig> = z.discriminatedUnion("type", [
  s3stateSchema,
  fsStateSchema,
]).describe(
  "State backend config, only required when not using oss version",
);
