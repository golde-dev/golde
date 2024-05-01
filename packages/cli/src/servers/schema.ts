import { z, type ZodType } from "zod";
import type { HCloudServerConfig, ServersConfig } from "./types.ts";

export const hCloudServerSchema: ZodType<HCloudServerConfig> = z.object({
  type: z.string(),
});

export const serversSchema: ZodType<ServersConfig> = z
  .object({
    hcloud: z
      .record(hCloudServerSchema)
      .optional(),
  });
