import { implement } from "../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../utils/resource.ts";
import { tagsSchema } from "../../utils/tags.ts";
import { z } from "zod";
import type { UserConfig } from "./types.ts";

export const userSchema = implement<UserConfig>().with({
  branch: branchSchema,
  branchPattern: branchPatternSchema,
  managedPoliciesArns: z.array(z.string()).optional(),
  tags: tagsSchema.optional(),
})
  .strict()
  .transform(transformBranch);

const userNameSchema = z
  .string()
  .min(1, { message: "User name must be at least 1 character long" })
  .max(64, { message: "User name must be at most 64 characters long" })
  .regex(/^[A-Za-z0-9+=,.@-]+$/, {
    message: "Username can only contain alphanumeric characters and +=,.@-",
  });

export const iamUserSchema = z.record(userNameSchema, userSchema);
