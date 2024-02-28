import type { CloudflareDNSRecord, DNSConfig } from "./dns";
import { ZodType, z } from "zod";

const cloudflareDNSRecord: ZodType<CloudflareDNSRecord> = z
  .object({
    value: z.string(),
    ttl: z
      .number()
      .optional()
      .describe("TTL in seconds"),
    proxied: z.boolean().optional(),
    branch: z.string().optional(),
    branchPattern: z.string().optional()
  })
  .strict()
  .refine(
    data => data.branchPattern && data.branch,
    'Cannot use both branchPattern and branch',
  );


export const dnsSchema: ZodType<DNSConfig> = z
  .object({
    cloudflare: z
      .record(
        z.object({
          A: z.record(cloudflareDNSRecord).optional(),
          AAAA: z.record(cloudflareDNSRecord).optional()
        }))
      .optional()
  });

