import { writeFileSync } from "fs";
import { schema } from "../schema";
import { zodToJsonSchema } from "zod-to-json-schema";

const jsonSchema = zodToJsonSchema(schema, "deployer")

writeFileSync("schema.json", JSON.stringify(jsonSchema, null, 2));