import type { SlackOutputConfig } from "./types.ts";
import { z } from "zod";
import { implement } from "@/utils/zod.ts";
import { messagesConfigSchema } from "./outputs/channel/message/schema.ts";

export const slackCredentialsSchema = z.object({
  apiToken: z.string().describe("Slack API token"),
});

export const slackOutputsSchema = implement<SlackOutputConfig>().with({
  channel: z.object({
    message: messagesConfigSchema,
  }),
});
