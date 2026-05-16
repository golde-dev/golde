import { z } from "zod";
import { domainNameSchema } from "../../../../generic/schema.ts";
import {
  branchPatternSchema,
  branchSchema,
  transformBranch,
} from "../../../../utils/resource.ts";
import { labelsSchema } from "../../../utils.ts";
import type { DNSConfig, RecordConfig } from "./types.ts";
import type { ZodType } from "zod";

const recordTypeSchema = z.union([
  z.literal("A"),
  z.literal("AAAA"),
  z.literal("CAA"),
  z.literal("CNAME"),
  z.literal("DS"),
  z.literal("HINFO"),
  z.literal("HTTPS"),
  z.literal("MX"),
  z.literal("NS"),
  z.literal("PTR"),
  z.literal("RP"),
  z.literal("SOA"),
  z.literal("SRV"),
  z.literal("SVCB"),
  z.literal("TLSA"),
  z.literal("TXT"),
]);

const recordSchema: ZodType<RecordConfig> = z
  .object({
    value: z.union([z.string(), z.array(z.string()).min(1)]),
    ttl: z
      .number()
      .int()
      .min(60)
      .max(2147483647)
      .optional()
      .describe("RRSet TTL in seconds"),
    comment: z.string().optional(),
    labels: labelsSchema,
    branch: branchSchema,
    branchPattern: branchPatternSchema,
  })
  .strict()
  .transform(transformBranch);

/**
 * RRSet name — Hetzner accepts short names like `www`, the apex `@`, and
 * punycode (`xn--4bi`). Only restriction: lowercase, no trailing dot, no
 * embedded zone-name. Per
 * https://docs.hetzner.cloud/reference/cloud#tag/zone-rrsets.
 */
const rrsetNameSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^(@|[a-z0-9_*-]+(\.[a-z0-9_*-]+)*)$/, {
    message: "RRSet name must be lowercase, may contain letters/digits/_/-/* and dots, or @ for the apex",
  });

const dnsRecordsSchema = z
  .record(rrsetNameSchema, recordSchema)
  .optional();

export const dnsSchema: ZodType<DNSConfig> = z.record(
  domainNameSchema,
  z.record(recordTypeSchema, dnsRecordsSchema),
);
