import type { DiscordActionConfig } from "../types.ts";

export async function executeDiscordAction(action: DiscordActionConfig): Promise<void> {
  const response = await fetch(action.webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: action.message }),
  });
  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
  }
}
