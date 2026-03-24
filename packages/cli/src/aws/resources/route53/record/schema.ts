import { z } from "zod";
import { domainNameSchema } from "@/generic/schema.ts";
import { tagsSchema } from "@/utils/tags.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "@/utils/resource.ts";
import type { RecordConfig, Route53RecordConfig } from "./types.ts";
import type { ZodType } from "zod";

const recordTypeSchema = z.union([
  z.literal("A"),
  z.literal("AAAA"),
  z.literal("CAA"),
  z.literal("CNAME"),
  z.literal("DKIM"),
  z.literal("DMARC"),
  z.literal("DNSKEY"),
  z.literal("DS"),
  z.literal("MX"),
  z.literal("NS"),
  z.literal("PTR"),
  z.literal("SOA"),
  z.literal("SPF"),
  z.literal("SRV"),
  z.literal("SVCB"),
  z.literal("TXT"),
]);

const dnsRecordSchema: ZodType<RecordConfig> = z
  .object({
    value: z.string(),
    ttl: z
      .number()
      .optional()
      .describe("TTL in seconds"),
    proxied: z.boolean().optional(),
    comment: z.string().optional(),
    tags: tagsSchema,
    branch: branchSchema,
    branchPattern: branchPatternSchema,
  })
  .strict()
  .transform(transformBranch);

const dnsRecordsSchema = z
  .record(domainNameSchema, dnsRecordSchema)
  .optional();

export const route53RecordSchema: ZodType<Route53RecordConfig> = z
  .record(
    domainNameSchema,
    z.record(
      recordTypeSchema,
      dnsRecordsSchema,
    ),
  );
