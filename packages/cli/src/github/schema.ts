import { z } from "zod";
import { implement } from "../utils/zod.ts";
import type { GithubCredentials } from "./types.ts";
import type { GithubResourcesConfig } from "./types.ts";
import { registryDockerImagesSchema } from "./resources/registry/dockerImage/schema.ts";

export const githubCredentialsSchema = implement<GithubCredentials>()
  .with({
    username: z
      .string()
      .describe("Github username"),
    accessToken: z
      .string()
      .describe("Github Personal access token"),
  })
  .describe("Github provider config")
  .strict();

export const githubResourcesConfigSchema = implement<GithubResourcesConfig>()
  .with({
    registry: z.object({
      dockerImage: registryDockerImagesSchema.optional(),
    }).optional(),
  })
  .describe("Github resources config")
  .strict();
