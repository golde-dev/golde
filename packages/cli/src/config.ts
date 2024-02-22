
import {z} from "zod";
import {pino} from "pino";
import {config} from "dotenv";
import {join} from "path";

config({
  path: join(process.cwd(), ".env"),
});

const schema = z.object({
  S3_REGION: z.string().default("auto"),
  S3_ENDPOINT: z.string(),
  S3_BUCKET: z.string(),
  S3_API_KEY: z.string(),
  S3_API_SECRET: z.string(),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  pino().error(result.error.format(), "Invalid environment variables:");
  process.exit(1);
}

export default result.data;