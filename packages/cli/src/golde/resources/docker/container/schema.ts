import { z } from "zod";
import { implement } from "@/utils/zod.ts";
import type { ContainerConfig } from "./types.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "@/utils/resource.ts";
import { tagsSchema } from "@/utils/tags.ts";

export const containerSchema = implement<ContainerConfig>()
  .with({
    branch: branchSchema,
    branchPattern: branchPatternSchema,
    tags: tagsSchema,
    server: z
      .string()
      .describe("Name of server to run container on"),
    image: z
      .string()
      .describe("Name and version of image to run"),
  })
  .strict()
  .transform(transformBranch);

export const containerNameSchema = z.string();

export const containersSchema = z.record(containerNameSchema, containerSchema);
