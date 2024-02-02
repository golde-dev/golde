
import {z} from "zod";
import {pino} from "pino";

const schema = z.object({
  LOGTAIL_TOKEN: z.string(),
  API_LOG_LEVEL: z.string(),

  R2_ENDPOINT: z.string(),
  R2_BUCKET: z.string(),
  R2_API_KEY: z.string(),
  R2_API_SECRET: z.string(),
});


const result = schema.safeParse({
  ...process.env,
});

if (!result.success) {
  pino().error(result.error.format(), "Invalid environment variables:");
  process.exit(1);
}

export default result.data;