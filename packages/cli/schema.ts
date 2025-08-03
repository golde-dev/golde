import { schema } from "./src/schema.ts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { logger } from "./src/logger.ts";
import { writeJSON } from "./src/utils/json.ts";

const jsonSchema = zodToJsonSchema(schema, "golde");

logger.info("[Schema][CLI] Writing schema.json");
await writeJSON("schema.json", jsonSchema);
