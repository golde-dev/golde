import { exit } from "process";
import { createLogger, format } from "winston";
import { z } from "zod";

const schema = z.object({
  API_LOG_PRETTY: z.string().transform(Boolean),
  API_LOG_LEVEL: z.string(),
  API_PORT: z.string().transform(Number),
  S3_REGION: z.string().default("auto"),
  S3_ENDPOINT: z.string(),
  S3_BUCKET: z.string(),
  S3_API_KEY: z.string(),
  S3_API_SECRET: z.string(),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  createLogger({
    format: format.combine(
      format.json()
    ),
  }).error("Invalid environment variables:", result.error.format());

  exit(1);
}

export default result.data;