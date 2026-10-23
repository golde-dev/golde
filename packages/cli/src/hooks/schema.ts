import { z } from "zod";
import type { HookAction, On } from "./types.ts";

const branchFields = {
  branch: z.string().optional(),
  branchPattern: z.string().optional(),
};

export const discordActionSchema = z.strictObject({
  discord: z.strictObject({
    webhook: z.string().describe("Discord webhook URL"),
    message: z.string().describe("Message template"),
  }),
  ...branchFields,
});

export const slackActionSchema = z.strictObject({
  slack: z.strictObject({
    channel: z.string().describe("Slack channel"),
    text: z.string().describe("Message template"),
  }),
  ...branchFields,
});

export const webhookActionSchema = z.strictObject({
  webhook: z.strictObject({
    url: z.string().describe("Webhook URL"),
    method: z.string().optional().describe("HTTP method, defaults to POST"),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.string().optional().describe("Body template, defaults to a JSON payload"),
  }),
  ...branchFields,
});

export const hookActionSchema: z.ZodType<HookAction> = z.union([
  discordActionSchema,
  slackActionSchema,
  webhookActionSchema,
]);

const hookActionsSchema = z.array(hookActionSchema).optional();

export const onSchema: z.ZodType<On> = z.strictObject({
  success: hookActionsSchema,
  failure: hookActionsSchema,
  changed: hookActionsSchema,
  unchanged: hookActionsSchema,
  destroy: hookActionsSchema,
  prune: hookActionsSchema,
});
