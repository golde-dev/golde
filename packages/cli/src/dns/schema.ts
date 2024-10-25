import { z } from "zod";
import type { BaseDNSRecord, CloudflareDNSRecord, DNSConfig, RecordType } from "./types.ts";
import type { ZodType } from "zod";
import { tagsSchema } from "../utils/tags.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../utils/resource.ts";

const recordTypeSchema: ZodType<RecordType> = z.union([
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

/**
 * Regular dns record used by many dns providers
 */
const dnsRecord: ZodType<BaseDNSRecord> = z
  .object({
    value: z.string(),
    ttl: z
      .number()
      .optional()
      .describe("TTL in seconds"),
    branch: branchSchema,
    branchPattern: branchPatternSchema,
  })
  .strict()
  .transform(transformBranch);

const dnsRecords = z
  .record(dnsRecord)
  .optional();

const cloudflareDNSRecord: ZodType<CloudflareDNSRecord> = z
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

const cloudflareRecords = z
  .record(cloudflareDNSRecord)
  .optional();

export const dnsSchema: ZodType<DNSConfig> = z
  .object({
    cloudflare: z
      .record(
        z.record(
          recordTypeSchema,
          cloudflareRecords,
        ),
      )
      .optional(),
    namecheap: z
      .record(
        z.record(
          recordTypeSchema,
          dnsRecords,
        ),
      )
      .optional(),
  });
