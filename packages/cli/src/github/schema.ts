import { z } from "zod";
import { implement } from "../utils/zod.ts";
import type { GithubCredentials } from "./types.ts";
import type { GithubConfig } from "./types.ts";
import { registryDockerImagesSchema } from "./resources/registryDockerImage/schema.ts";

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

export const githubConfigSchema = implement<GithubConfig>()
  .with({
    registryDockerImage: registryDockerImagesSchema.optional(),
  })
  .describe("Github resources config")
  .strict();
