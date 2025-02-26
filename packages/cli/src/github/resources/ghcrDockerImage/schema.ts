import { z } from "zod";
import { implement } from "../../../utils/zod.ts";
import type { RegistryDockerImagesConfig } from "./types.ts";

export const imageConfigSchema = implement<RegistryDockerImagesConfig>()
  .with({});

const dockerRepositoryRegex = /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*$/;

const imageRepositorySchema = z
  .string()
  .min(1, { message: "Repository name cannot be empty" })
  .max(255, { message: "Repository name too long (max 255 characters)" })
  .regex(dockerRepositoryRegex, { message: "Invalid Docker repository name format" });

export const registryDockerImagesSchema = z.record(imageRepositorySchema, imageConfigSchema);
