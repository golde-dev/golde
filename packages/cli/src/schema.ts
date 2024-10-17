import type { Config } from "./types/config.ts";
import { ConfigError, ConfigErrorCode } from "./error.ts";
import { dnsSchema } from "./dns/schema.ts";
import type { ZodType } from "zod";
import { z } from "zod";
import { providersSchema } from "./providers/schema.ts";
import { bucketSchema } from "./buckets/schema.ts";
import { artifactsSchema } from "./artifacts/schema.ts";
import { stateSchema } from "./state/schema.ts";

export const projectNameSchema = z
  .string()
  .min(2, "Project name must be at least 2 characters long.")
  .regex(
    /^[A-Za-z0-9_@./#&+-]*$/,
    "Projects name may include alphanumeric characters and the following special symbols: -, _, @, ., /, #, &, +.",
  );

export const tagsSchema = z.record(z.string());

export const schema: ZodType<Config> = z
  .object({
    name: projectNameSchema,
    tags: tagsSchema.optional(),
    state: stateSchema.optional(),
    providers: providersSchema.optional(),
    dns: dnsSchema.optional(),
    buckets: bucketSchema.optional(),
    artifacts: artifactsSchema.optional(),
  }).strict();

export function validateConfig(config: unknown): asserts config is Config {
  const result = schema.safeParse(config);
  if (!result.success) {
    throw new ConfigError(
      "Failed schema validation",
      ConfigErrorCode.INVALID_CONFIG,
      result.error.flatten(),
    );
  }
}
