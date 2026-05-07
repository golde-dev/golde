import { z } from "zod";
import { implement } from "../../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../../utils/resource.ts";
import { labelsSchema } from "../../utils.ts";
import type { SSHKeyConfig, SSHKeyConfigs } from "./types.ts";
import type { ZodType } from "zod";

export const sshKeySchema: ZodType<SSHKeyConfig> = implement<SSHKeyConfig>()
  .with({
    publicKey: z
      .string()
      .min(1)
      .describe("SSH public key, single-line (e.g. ssh-ed25519 AAAA... user@host)"),
    labels: labelsSchema,
    branch: branchSchema,
    branchPattern: branchPatternSchema,
  })
  .strict()
  .transform(transformBranch);

const sshKeyNameSchema = z
  .string()
  .min(1)
  .max(64);

export const sshKeysSchema: ZodType<SSHKeyConfigs> = z
  .record(sshKeyNameSchema, sshKeySchema);
