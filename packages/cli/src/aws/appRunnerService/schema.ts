import { z } from "zod";
import { implement } from "../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../utils/resource.ts";
import { tagsSchema } from "../../utils/tags.ts";
import type { ServiceConfig } from "./types.ts";

export const serviceSchema = implement<ServiceConfig>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    tags: tagsSchema,
    region: z.string().optional(),
  })
  .strict()
  .transform(transformBranch);

export const nameSchema = z
  .string()
  .min(4, "ServiceName must be at least 4 characters long.")
  .max(40, "ServiceName cannot exceed 40 characters.")
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9-]*$/,
    "ServiceName can only contain alphanumeric characters and hyphens, and must start with an alphanumeric character.",
  );

export const appRunnerServiceSchema = z.record(nameSchema, serviceSchema);
