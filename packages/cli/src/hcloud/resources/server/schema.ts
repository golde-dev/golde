import { z } from "zod";
import { implement } from "../../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../../utils/resource.ts";
import type { ServerConfig, ServerConfigs } from "./types.ts";
import type { ZodType } from "zod";

const labelKeySchema = z
  .string()
  .min(1)
  .max(63)
  .regex(
    /^[A-Za-z][A-Za-z0-9._-]*$/,
    {
      message: "Hetzner label key must start with a letter and contain only [A-Za-z0-9._-]",
    },
  );

const labelValueSchema = z
  .string()
  .max(63)
  .regex(
    /^[A-Za-z0-9._-]*$/,
    {
      message: "Hetzner label value may contain only [A-Za-z0-9._-]",
    },
  );

const labelsSchema = z
  .record(labelKeySchema, labelValueSchema)
  .optional();

export const serverSchema: ZodType<ServerConfig> = implement<ServerConfig>()
  .with({
    image: z.string().describe("OS image name or id, e.g. ubuntu-22.04"),
    serverType: z.string().describe("Hetzner server type, e.g. cpx11"),
    location: z.string().optional(),
    datacenter: z.string().optional(),
    sshKeys: z.array(z.string()).optional(),
    userData: z.string().optional(),
    labels: labelsSchema,
    enableIpv4: z.boolean().optional(),
    enableIpv6: z.boolean().optional(),
    branch: branchSchema,
    branchPattern: branchPatternSchema,
  })
  .strict()
  .refine(
    (data) => !(data.location && data.datacenter),
    { message: "Specify either `location` or `datacenter`, not both" },
  )
  .transform(transformBranch);

const serverNameSchema = z
  .string()
  .min(1)
  .max(63)
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/,
    {
      message: "Hetzner server name must be a valid hostname (RFC 1123)",
    },
  );

export const serversSchema: ZodType<ServerConfigs> = z
  .record(serverNameSchema, serverSchema);
