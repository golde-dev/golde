import { z } from "zod";
import type { Archive, ArtifactsConfig, DockerImage } from "./types.ts";
import { implement } from "../utils/zod.ts";
import { tagsSchema } from "../utils/tags.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../utils/resource.ts";

const dockerImage = implement<DockerImage>()
  .with({
    context: z.string().optional(),
    dockerfile: z.string().optional(),
    labels: z.record(z.string()).optional(),
    tags: tagsSchema,
    branch: branchSchema,
    branchPattern: branchPatternSchema,
  })
  .strict()
  .transform(transformBranch);

const archive = implement<Archive>()
  .with({
    context: z.string().optional(),
    branch: z.string().optional(),
    branchPattern: z.string().optional(),
  })
  .strict()
  .transform(transformBranch);

export const artifactsSchema = implement<ArtifactsConfig>().with({
  docker: z.record(dockerImage).optional(),
  archive: z.record(archive).optional(),
}).strict();
