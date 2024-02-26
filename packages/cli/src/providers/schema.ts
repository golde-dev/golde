import type { JSONSchemaType } from "ajv";
import type { ProvidersConfig } from "./provider";

export const providersSchema: JSONSchemaType<ProvidersConfig> = {
  type: "object",
  properties: {
    cloudflare: {
      type: "object",
      description: "Cloudflare provider config",
      properties: {
        apiKey: {
          type: "string",
          minLength: 32,
          maxLength: 32,
          description: "Cloudflare api key https://developers.cloudflare.com/fundamentals/api/get-started/create-token/",
        },
      },
      required: ["apiKey"],
      nullable: true,
      additionalProperties: false,
    },
    hcloud: {
      type: "object",
      description: "Hetzner provider config",
      properties: {
        apiKey: {
          type: "string",
          description: "Hetzner api key https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/",
        },
      },
      required: ["apiKey"],
      nullable: true,
      additionalProperties: false,
    },
    deployer: {
      type: "object",
      description: "Deployer provider config",
      properties: {
        apiKey: {
          type: "string",
          description: "Deployer api key",
        },
      },
      required: ["apiKey"],
      nullable: true,
      additionalProperties: false,
    },
    state: {
      type: "object",
      description: "State provider config, only required when not using oss version",
      properties: {
        bucket: {
          type: "string",
          description: "Name of s3 bucket",
        },
        region: {
          type: "string",
          description: "name of region, use auto for R2",
        },
        endpoint: {
          type: "string",
          description: "s3 endpoint",
        },
        accessKeyId: {
          type: "string",
          description: "access key id",
        },
        secretAccessKey: {
          type: "string",
          description: "s3 access key",
        },
      },
      required: ["bucket", "region", "endpoint", "accessKeyId", "secretAccessKey"],
      nullable: true,
      additionalProperties: false,
    },
  },
};