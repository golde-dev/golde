import { writeFileSync } from "fs";
import { schema } from "../schema";


writeFileSync("schema.json", JSON.stringify(schema, null, 2));