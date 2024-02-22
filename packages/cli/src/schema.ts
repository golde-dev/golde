import type { JSONSchemaType } from "ajv";
import type { Config } from "./types/config";
import { providersSchema } from "./providers/schema";
import Ajv from "ajv/dist/2019";

const ajv = new Ajv({
  strict: true, 
  strictSchema: true,
});

export const schema: JSONSchemaType<Config> = {
  "$id": "https://deployer.com/product.schema.json",
  "title": "Deployer",
  "description": "schema for deployer config",

  type: "object",
  properties: { 
    project: {
      type: "string",
    },
    providers: providersSchema,
  },
  required: ["providers"],
};

const validate = ajv.compile(schema);

export function validateConfig(config: unknown): asserts config is Config {
  if (!validate(config)) {
    throw new Error("Failed schema validation", {cause: validate.errors});
  }
}
