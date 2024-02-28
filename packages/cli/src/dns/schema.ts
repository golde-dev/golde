import type { JSONSchemaType } from "ajv";
import type { CloudflareDNSRecord, DNSConfig } from "./dns";

const dnsRecordSchema: JSONSchemaType<CloudflareDNSRecord> =  {
  type: "object",
  properties: {
    value: {type: "string"},
    ttl: {type: "number", nullable: true},
    proxied: {type: "boolean", nullable: true},
    branch: {type: "string", nullable: true},
    branchPattern: {type: "string", nullable: true},
  },
  required: ["value"],
};


export const dnsSchema: JSONSchemaType<DNSConfig> = {
  type: "object",
  properties: {
    cloudflare: {
      type: "object",
      nullable: true,
      propertyNames: {type: "string"},
      required: [],
      additionalProperties: {
        type: "object",
        nullable: true,
        required: [],
        properties: {
          A: {
            type: "object",
            nullable: true,
            required: [],
            additionalProperties: dnsRecordSchema,
          },
          AAAA: {
            type: "object",
            nullable: true,
            required: [],
            additionalProperties: dnsRecordSchema,
          },
        },
      },
    },
  },
  required: [],
};
