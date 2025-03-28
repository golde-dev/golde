import { z } from "zod";
import { load } from "@std/dotenv";
import { exit } from "node:process";

await load({ export: true });

const defaultLogLevel = "INFO";
const defaultPretty = "false";

const schema = z.object({
  API_LOG_PRETTY: z
    .string()
    .transform(Boolean)
    .default(defaultPretty),
  API_LOG_LEVEL: z
    .string()
    .default(defaultLogLevel),
});

const result = schema.safeParse({
  API_LOG_PRETTY: Deno.env.get("API_LOG_PRETTY"),
  API_LOG_LEVEL: Deno.env.get("API_LOG_LEVEL"),
  API_PORT: Deno.env.get("API_PORT"),
});

if (!result.success) {
  console.error("Invalid environment variables:", result.error.format());
  exit(1);
}

export default result.data;
