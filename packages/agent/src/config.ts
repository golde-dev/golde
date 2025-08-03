import { z } from "zod";
import { loadEnvFile } from "node:process";
import { exit } from "node:process";

loadEnvFile();

const defaultLogLevel = "info";
const defaultPretty = false;

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
  console.error("Invalid environment variables:", z.treeifyError(result.error));
  exit(1);
}

export default result.data;
