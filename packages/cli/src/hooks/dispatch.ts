import { logger } from "@/logger.ts";
import { formatDuration } from "@/utils/duration.ts";
import { getErrorMessage } from "@/utils/error.ts";
import { outputsTemplate, resolveTemplate, resourcesTemplate, runTemplate } from "@/utils/template.ts";
import { executeDiscordAction } from "./actions/discord.ts";
import { executeSlackAction } from "./actions/slack.ts";
import { executeWebhookAction } from "./actions/webhook.ts";
import type { Context } from "@/types/context.ts";
import type { SavedResource } from "@/types/dependencies.ts";
import type { HookAction, HookActionBase, HookEvent, RunInfo } from "./types.ts";

export function matchesBranch(action: HookActionBase, branch: string): boolean {
  const { branch: name, branchPattern } = action;
  if (name && name !== branch) {
    return false;
  }
  if (branchPattern && !new RegExp(branchPattern).test(branch)) {
    return false;
  }
  return true;
}

function executeAction(
  context: Context,
  event: HookEvent,
  action: HookAction,
  run: RunInfo,
  outputs: Record<string, string>,
): Promise<void> {
  if ("discord" in action) {
    return executeDiscordAction(action.discord);
  }
  if ("slack" in action) {
    return executeSlackAction(context.slack, action.slack);
  }
  return executeWebhookAction(action.webhook, {
    project: context.config.name,
    branch: context.git.branchName,
    event,
    run,
    outputs,
  });
}

/**
 * Fire hook actions for the given events
 * Failures are logged and never propagate to the caller
 */
export async function dispatchHooks(
  context: Context,
  events: HookEvent[],
  run: RunInfo,
  outputs: Record<string, string>,
  resources: Omit<SavedResource, "createdAt" | "updatedAt">[],
): Promise<void> {
  const actions = events.flatMap((event) =>
    (context.config.on?.[event] ?? [])
      .filter((action) => matchesBranch(action, context.git.branchName))
      .map((action) => ({ event, action }))
  );

  if (actions.length === 0) {
    return;
  }
  logger.debug(`[Hooks] Dispatching ${actions.length} actions for: ${events.join(", ")}`);
  const start = performance.now();

  const results = await Promise.allSettled(
    actions.map(({ event, action }) => {
      try {
        let resolved = resolveTemplate(action, outputsTemplate(outputs)) as HookAction;
        resolved = resolveTemplate(resolved, runTemplate(run)) as HookAction;
        resolved = resolveTemplate(resolved, resourcesTemplate(resources)) as HookAction;
        return executeAction(context, event, resolved, run, outputs);
      } catch (error) {
        return Promise.reject(error);
      }
    }),
  );

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      const { event } = actions[index] ?? {};
      logger.warn(`[Hooks] ${event} action failed: ${getErrorMessage(result.reason)}`);
    }
  }

  const end = performance.now();
  logger.info(`[Hooks] Dispatched ${actions.length} actions in ${formatDuration(end - start)}`);
}
