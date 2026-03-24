import { z } from "zod";
import { schema } from "./src/schema.ts";
import { logger } from "./src/logger.ts";
import { writeJSON } from "./src/utils/json.ts";


logger.info("[Schema][CLI] Writing schema.json");
const jsonSchema = z.toJSONSchema(schema, {unrepresentable: "any"});
await writeJSON("schema.json", jsonSchema);
