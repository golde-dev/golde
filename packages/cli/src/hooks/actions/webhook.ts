import type { WebhookActionConfig } from "../types.ts";

export async function executeWebhookAction(
  action: WebhookActionConfig,
  defaultPayload: object,
): Promise<void> {
  const response = await fetch(action.url, {
    method: action.method ?? "POST",
    headers: action.headers ?? { "Content-Type": "application/json" },
    body: action.body ?? JSON.stringify(defaultPayload),
  });
  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
  }
}
