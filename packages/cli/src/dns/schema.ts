import type { CloudflareDNSRecord, DNSConfig, RecordType } from "./dns";
import type { ZodType} from "zod";
import { z } from "zod";

const cloudflareDNSRecord: ZodType<CloudflareDNSRecord> = z
  .object({
    value: z.string(),
    ttl: z
      .number()
      .optional()
      .describe("TTL in seconds"),
    proxied: z.boolean().optional(),
    branch: z.string().optional(),
    branchPattern: z.string().optional(),
  })
  .strict()
  .refine(
    data => !(data.branchPattern && data.branch),
    "Cannot use both branchPattern and branch"
  );

const recordTypeUnionSchema: ZodType<RecordType> = z.union([
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

const recordsForTypeSchema = z
  .record(cloudflareDNSRecord)
  .optional();

export const dnsSchema: ZodType<DNSConfig> = z
  .object({
    cloudflare: z
      .record(
        z.record(
          recordTypeUnionSchema, 
          recordsForTypeSchema
        )
      )
      .optional(),
  });

