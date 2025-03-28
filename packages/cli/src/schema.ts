import { z } from "zod";
import { implement } from "./utils/zod.ts";
import { ConfigError, ConfigErrorCode } from "./error.ts";
import { stateSchema } from "./state/schema.ts";
import { tagsSchema } from "./utils/tags.ts";
import { awsCredentialsSchema, awsResourcesConfigSchema } from "./aws/schema.ts";
import { goldeCredentialsSchema, goldeResourcesConfigSchema } from "./golde/schema.ts";
import { githubCredentialsSchema, githubResourcesConfigSchema } from "./github/schema.ts";
import { slackCredentialsSchema, slackOutputsSchema } from "@/slack/schema.ts";
import { hcloudCredentialsSchema } from "./hcloud/schema.ts";
import {
  cloudflareCredentialsSchema,
  cloudflareResourcesConfigSchema,
} from "./cloudflare/schema.ts";
import type { Config, ProvidersConfig, Resources } from "./types/config.ts";
import type { ZodType } from "zod";
import type { Outputs } from "@/types/output.ts";

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
    slack: slackCredentialsSchema.optional(),
  })
  .strict();

export const outputsSchema = implement<Outputs>().with({
  slack: slackOutputsSchema.optional(),
});

export const resourcesSchema = implement<Resources>().with({
  aws: awsResourcesConfigSchema.optional(),
  github: githubResourcesConfigSchema.optional(),
  cloudflare: cloudflareResourcesConfigSchema.optional(),
  golde: goldeResourcesConfigSchema.optional(),
});

export const schema = implement<Config>().with({
  name: projectNameSchema,
  tags: tagsSchema.optional(),
  state: stateSchema.optional(),
  providers: providersSchema.optional(),
  resources: resourcesSchema.optional(),
  outputs: outputsSchema.optional(),
}).strict();

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
