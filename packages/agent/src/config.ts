import { z } from "zod";
import { load } from "@std/dotenv";
import { defaultCrt, defaultKey } from "./constants/certs.ts";

await load({ export: true });

const defaultLogLevel = "info";
const defaultPretty = "false";
const defaultPort = "4111";

const schema = z.object({
  API_LOG_PRETTY: z
    .string()
    .transform(Boolean)
    .default(defaultPretty),
  API_LOG_LEVEL: z
    .string()
    .default(defaultLogLevel),
  API_PORT: z.string()
    .transform(Number)
    .default(defaultPort),
  API_KEY: z.string(),
  API_CERT: z.string(),
});

const apiKeyPath = Deno.env.get("API_KEY");
const apiCertPath = Deno.env.get("API_CERT");

const result = schema.safeParse({
  API_LOG_PRETTY: Deno.env.get("API_LOG_PRETTY"),
  API_LOG_LEVEL: Deno.env.get("API_LOG_LEVEL"),
  API_PORT: Deno.env.get("API_PORT"),
  API_KEY: apiKeyPath ? Deno.readTextFileSync(apiKeyPath) : defaultKey,
  API_CERT: apiCertPath ? Deno.readTextFileSync(apiCertPath) : defaultCrt,
});

if (!result.success) {
  console.error("Invalid environment variables:", result.error.format());

  Deno.exit(1);
}

export default result.data;
