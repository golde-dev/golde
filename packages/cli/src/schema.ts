import type { Config } from "./types/config";
import { ConfigError, ConfigErrorCode } from "./error";
import { dnsSchema } from "./dns/schema";
import type { ZodType} from "zod";
import { z } from "zod";
import { providersSchema } from "./providers/schema";
import { bucketSchema } from "./buckets/schema";

export const schema: ZodType<Config> = z
  .object({
    project: z.string(),
    providers: providersSchema,
    dns: dnsSchema.optional(),
    buckets: bucketSchema.optional(),
  }).strict();

export function validateConfig(config: unknown): asserts config is Config {
  const result = schema.safeParse(config);
  if (!result.success) {
    throw new ConfigError("Failed schema validation", ConfigErrorCode.INVALID_CONFIG, result.error.issues);
  }
}
