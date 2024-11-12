import { z } from "zod";
import { branchPatternSchema, branchSchema, transformBranch } from "../../utils/resource.ts";
import { tagsSchema } from "../../utils/tags.ts";
import { implement } from "../../utils/zod.ts";
import type { ObjectConfig } from "./types.ts";

export const objectConfigSchema = implement<ObjectConfig>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    tags: tagsSchema,
  })
  .strict()
  .transform(transformBranch);

export const s3ObjectSchema = z.record(objectConfigSchema);
