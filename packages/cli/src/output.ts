import { logger } from "./logger.ts";
import { Type } from "./types/plan.ts";
import { formatDuration } from "./utils/duration.ts";
import { getErrorMessage } from "./utils/error.ts";
import { resolveTemplateString, resourcesTemplate } from "./utils/template.ts";
import { isEmpty } from "es-toolkit/compat";
import type { Change } from "./types/plan.ts";
import type { Context } from "./types/context.ts";
import type { Outputs } from "./types/output.ts";
import type { RunInfo } from "./hooks/types.ts";
import type { SavedResource } from "./types/dependencies.ts";

/**
 * Resolve output value templates against resource state
 * Unresolvable values keep the raw template and never fail the run
 */
export function resolveOutputs(
  outputs: Outputs | undefined,
  resources: Omit<SavedResource, "createdAt" | "updatedAt">[],
): Record<string, string> {
  if (isEmpty(outputs)) {
    return {};
  }
  const onTemplate = resourcesTemplate(resources);

  return Object.fromEntries(
    Object.entries(outputs).map(([name, template]) => {
      try {
        return [name, `${resolveTemplateString(template, onTemplate)}`];
      } catch (error) {
        logger.warn(`[Output] Failed to resolve output ${name}: ${getErrorMessage(error)}`);
        return [name, template];
      }
    }),
  );
}

export function formatOutputs(outputs: Record<string, string>): string[] {
  const width = Math.max(0, ...Object.keys(outputs).map((name) => name.length));
  return Object.entries(outputs).map(([name, value]) => `${name.padEnd(width)} = ${value}`);
}

export function printOutputs(outputs: Record<string, string>): void {
  if (isEmpty(outputs)) {
    return;
  }
  logger.info("[Output] Outputs:");
  for (const line of formatOutputs(outputs)) {
    logger.info(`  ${line}`);
  }
}

export async function persistOutputs(
  context: Context,
  outputs: Record<string, string>,
): Promise<void> {
  const { config, git } = context;
  try {
    await context.state.saveOutputs(config.name, git.branchName, outputs);
  } catch (error) {
    logger.warn(error, "[Output] Failed to persist outputs");
  }
}

const changeGroups: Partial<Record<Type, string>> = {
  [Type.Create]: "created",
  [Type.CreateVersion]: "created",
  [Type.Update]: "updated",
  [Type.UpdateVersion]: "updated",
  [Type.Delete]: "deleted",
  [Type.DeleteVersion]: "deleted",
  [Type.ChangeVersion]: "version changed",
};

export function summarizeChanges(changes: Change[]): string {
  const counts = new Map<string, number>();
  for (const { type } of changes) {
    const group = changeGroups[type];
    if (group) {
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    return "no changes";
  }
  return [...counts.entries()]
    .map(([group, count]) => `${count} ${group}`)
    .join(", ");
}

export function buildRunInfo(
  command: RunInfo["command"],
  status: RunInfo["status"],
  startedAt: number,
  changes: Change[],
  error?: unknown,
): RunInfo {
  return {
    status,
    command,
    duration: formatDuration(performance.now() - startedAt),
    changes: summarizeChanges(changes),
    error: getErrorMessage(error),
  };
}
