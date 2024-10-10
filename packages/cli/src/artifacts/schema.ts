import { z } from "zod";
import type { Archive, ArtifactsConfig, DockerImage } from "./types.ts";
import { implement } from "../utils/zod.ts";

const dockerImage = implement<DockerImage>()
  .with({
    context: z.string().optional(),
    dockerfile: z.string().optional(),
    labels: z.record(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    branch: z.string().optional(),
    branchPattern: z.string().optional(),
  })
  .strict()
  .refine(
    (data) => !(data.branchPattern && data.branch),
    "Cannot use both branchPattern and branch",
  );

const archive = implement<Archive>()
  .with({
    context: z.string().optional(),
    branch: z.string().optional(),
    branchPattern: z.string().optional(),
  })
  .strict()
  .refine(
    (data) => !(data.branchPattern && data.branch),
    "Cannot use both branchPattern and branch",
  );

export const artifactsSchema = implement<ArtifactsConfig>().with({
  docker: z.record(dockerImage).optional(),
  archive: z.record(archive).optional(),
}).strict();
