import { z } from "zod";
import { tagsSchema } from "@/utils/tags.ts";
import { domainNameSchema } from "@/generic/schema.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "@/utils/resource.ts";
import type { DNSConfig, RecordConfig } from "./types.ts";
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


export const dnsSchema: ZodType<DNSConfig> = z
  .record(
    domainNameSchema,
    z.record(
      recordTypeSchema,
      dnsRecordsSchema,
    ),
  );
