import { z } from "zod";
import { branchPatternSchema, branchSchema, transformBranch } from "../../../utils/resource.ts";
import { tagsSchema } from "../../../utils/tags.ts";
import { implement } from "../../../utils/zod.ts";
import type { PolicyDocument, RoleConfig, Statement } from "./types.ts";

const principalSchema = z.object({
  AWS: z.union([z.string(), z.array(z.string())]).optional(),
  Service: z.union([z.string(), z.array(z.string())]).optional(),
  Federated: z.union([z.string(), z.array(z.string())]).optional(),
  CanonicalUser: z.union([z.string(), z.array(z.string())]).optional(),
}).strict();

export const policyStatementSchema = implement<Statement>().with({
  Sid: z.string().optional(),
  Principal: principalSchema.optional(),
  Action: z.union([
    z.string(),
    z.array(z.string()),
  ]),
  Resource: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
  Effect: z.enum(["Allow", "Deny"]),
});

export const policyArn = z.string();

export const policyDocumentSchema = implement<PolicyDocument>()
  .with({
    Version: z.enum(["2012-10-17"]),
    Statement: z.array(policyStatementSchema),
  });

const pathSchema = z
  .string()
  .min(1, { message: "Path must be at least 1 character long" })
  .max(512, { message: "Path must be at most 512 characters long" })
  .regex(/^\/[A-Za-z0-9=,.\-@/]*\/$/, {
    message: "Path must start and end with '/' and contain only valid characters",
  });

export const roleConfigSchema = implement<RoleConfig>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    tags: tagsSchema,
    assumeRolePolicy: policyDocumentSchema,
    description: z.string().min(1).optional(),
    path: pathSchema.optional(),
    inlinePolicy: policyDocumentSchema.optional(),
    permissionsBoundaryArn: policyArn.optional(),
    managedPoliciesArns: z
      .array(policyArn)
      .optional(),
  })
  .strict()
  .transform(transformBranch);

export const roleNameSchema = z
  .string()
  .min(1, { message: "Role name must be at least 1 character long" })
  .max(64, { message: "Role name must be at most 64 characters long" })
  .regex(/^[A-Za-z0-9+=,.@-]+$/, {
    message: "Role name can only contain alphanumeric characters and +=,.@-",
  });

export const iamRoleSchema = z.record(roleNameSchema, roleConfigSchema);
