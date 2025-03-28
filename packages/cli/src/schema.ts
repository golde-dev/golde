import { z } from "zod";
import { ConfigError, ConfigErrorCode } from "./error.ts";
import { stateSchema } from "./state/schema.ts";
import { tagsSchema } from "./utils/tags.ts";
import { awsConfigSchema, awsCredentialsSchema } from "./aws/schema.ts";
import {
	cloudflareConfigSchema,
	cloudflareCredentialsSchema,
} from "./cloudflare/schema.ts";
import { goldeCredentialsSchema } from "./golde/schema.ts";
import {
	githubConfigSchema,
	githubCredentialsSchema,
} from "./github/schema.ts";
import { hcloudCredentialsSchema } from "./hcloud/schema.ts";
import type { Config, ProvidersConfig, Resources } from "./types/config.ts";
import type { ZodType } from "zod";
import { implement } from "./utils/zod.ts";
import type { Outputs } from "@/types/output.ts";
import { slackOutputsSchema } from "@/slack/schema.ts";

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

export const outputsSchema = implement<Outputs>().with({
  slack: slackOutputsSchema.optional(),
  
});

export const resourceSchema = implement<Resources>().with({
	aws: awsConfigSchema.optional(),
	github: githubConfigSchema.optional(),
	cloudflare: cloudflareConfigSchema.optional(),
});

export const schema: ZodType<Config> = z
	.object({
		name: projectNameSchema,
		tags: tagsSchema.optional(),
		state: stateSchema.optional(),
		providers: providersSchema.optional(),
		resources: resourceSchema.optional(),
		outputs: outputsSchema.optional(),
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
