import type { SlackClient } from "@/slack/client/client.ts";
import type { SlackActionConfig } from "../types.ts";

export async function executeSlackAction(
  client: SlackClient | undefined,
  action: SlackActionConfig,
): Promise<void> {
  if (!client) {
    throw new Error("Slack hook requires providers.slack to be configured");
  }
  await client.sendMessage(action.channel, action.text);
}
