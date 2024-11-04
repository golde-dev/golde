import { z } from "zod";
import { implement } from "../utils/zod.ts";
import type { DockerConfig } from "./types.ts";

export const dockerConfigSchema = implement<DockerConfig>()
  .with({
    registry: z
      .string()
      .describe("Docker registry url"),
    username: z
      .string()
      .describe("Docker registry username"),
    password: z
      .string()
      .describe("Docker registry password"),
  })
  .describe("Docker provider config")
  .strict();
