import { writeFileSync } from "node:fs";
import { schema } from "../schema.ts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { logger } from "../logger.ts";

const jsonSchema = zodToJsonSchema(schema, "golde");

logger.info("Writing schema.json");
writeFileSync("schema.json", JSON.stringify(jsonSchema, null, 2));
