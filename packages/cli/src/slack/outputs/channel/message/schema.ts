import { z } from "zod";
import { implement } from "@/utils/zod.ts";
import type { MessageConfig } from "./types.ts";

export const messageConfigSchema = implement<MessageConfig>().with({
	channel: z.string(),
	text: z.string(),
}); 

export const messagesConfigSchema = z.record(z.string(), messageConfigSchema);