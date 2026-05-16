import { z } from "zod";
import { implement } from "../../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../../utils/resource.ts";
import { labelsSchema } from "../../utils.ts";
import { domainNameSchema } from "../../../generic/schema.ts";
import type { PrimaryNameserverConfig, ZoneConfig, ZoneConfigs } from "./types.ts";
import type { ZodType } from "zod";

const primaryNameserverSchema: ZodType<PrimaryNameserverConfig> = z
  .object({
    address: z.string().min(1),
    port: z.number().int().min(1).max(65535).optional(),
    tsigAlgorithm: z.string().optional(),
    tsigKey: z.string().optional(),
  })
  .strict();

const ttlSchema = z
  .number()
  .int()
  .min(60)
  .max(2147483647)
  .describe("Default TTL for the zone (60–2147483647)");

export const zoneSchema: ZodType<ZoneConfig> = implement<ZoneConfig>()
  .with({
    mode: z.union([z.literal("primary"), z.literal("secondary")]),
    ttl: ttlSchema.optional(),
    primaryNameservers: z.array(primaryNameserverSchema).optional(),
    labels: labelsSchema,
    branch: branchSchema,
    branchPattern: branchPatternSchema,
  })
  .strict()
  .refine(
    (data) =>
      data.mode === "primary"
        ? !data.primaryNameservers
        : Array.isArray(data.primaryNameservers) && data.primaryNameservers.length > 0,
    {
      message:
        "primaryNameservers is required (and only allowed) when mode is 'secondary'",
    },
  )
  .transform(transformBranch);

export const zonesSchema: ZodType<ZoneConfigs> = z
  .record(domainNameSchema, zoneSchema);
