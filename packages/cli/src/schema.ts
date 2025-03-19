import { z } from "zod";
import { ConfigError, ConfigErrorCode } from "./error.ts";
import { stateSchema } from "./state/schema.ts";
import { tagsSchema } from "./utils/tags.ts";
import { awsConfigSchema, awsCredentialsSchema } from "./aws/schema.ts";
import { cloudflareConfigSchema, cloudflareCredentialsSchema } from "./cloudflare/schema.ts";
import { goldeCredentialsSchema } from "./golde/schema.ts";
import { githubCredentialsSchema } from "./github/schema.ts";
import { hcloudCredentialsSchema } from "./hcloud/schema.ts";
import type { Config, ProvidersConfig } from "./types/config.ts";
import type { ZodType } from "zod";

export const projectNameSchema = z
  .string()
  .min(2, "Project name must be at least 2 characters long.")
  .regex(
    /^[A-Za-z0-9_@./#&+-]*$/,
    "Projects name may include alphanumeric characters and the following special symbols: -, _, @, ., /, #, &, +.",
  );

export const providersSchema: ZodType<ProvidersConfig> = z
  .object({
    golde: goldeCredentialsSchema.optional(),
    aws: awsCredentialsSchema.optional(),
    github: githubCredentialsSchema.optional(),
    cloudflare: cloudflareCredentialsSchema.optional(),
    hcloud: hcloudCredentialsSchema.optional(),
  })
  .strict();

export const outputSchema = z.record(z.string());

export const schema: ZodType<Config> = z
  .object({
    name: projectNameSchema,
    tags: tagsSchema.optional(),
    state: stateSchema.optional(),
    providers: providersSchema.optional(),
    aws: awsConfigSchema.optional(),
    cloudflare: cloudflareConfigSchema.optional(),
    // output: outputSchema.optional(),
  })
  .strict();

export function validateConfig(config: unknown): Config {
  const { data, success, error } = schema.safeParse(config);

  if (!success) {
    throw new ConfigError(
      "Failed schema validation",
      ConfigErrorCode.INVALID_CONFIG,
      error.flatten(),
    );
  }
  return data;
}
