import { z } from "zod";
import { implement } from "../../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../../utils/resource.ts";
import type { DatabaseConfig } from "./types.ts";

export const databaseSchema = implement<DatabaseConfig>()
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
  })
  .strict()
  .transform(transformBranch);

const databaseNameSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-_]*$/,
    {
      message: "Invalid D1 Database name. Ensure it follows D1 naming rules.",
    },
  );

export const d1DatabaseSchema = z.record(databaseNameSchema, databaseSchema);
