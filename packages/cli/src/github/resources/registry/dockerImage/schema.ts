import { z } from "zod";
import { implement } from "@/utils/zod.ts";
import type { ImageConfig } from "@/generic/resources/docker/image/types.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "@/utils/resource.ts";

export const imageConfigSchema = implement<ImageConfig>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    maxVersions: z.number().optional(),
    version: z
      .enum([
        "ImageHash",
        "GitHash",
        "GitContextHash",
      ]),
    tags: z.array(z.string()).optional(),
    labels: z.record(z.string(), z.string()).optional(),
    context: z
      .string()
      .optional(),
    dockerfile: z
      .string()
      .optional(),
  })
  .transform(transformBranch);

const dockerRepositoryRegex = /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*$/;

const imageRepositorySchema = z
  .string()
  .min(1, { message: "Repository name cannot be empty" })
  .max(255, { message: "Repository name too long (max 255 characters)" })
  .regex(dockerRepositoryRegex, { message: "Invalid Docker repository name" });

export const registryDockerImagesSchema = z.record(imageRepositorySchema, imageConfigSchema);
