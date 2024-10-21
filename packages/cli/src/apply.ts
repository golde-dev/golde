import { logger } from "./logger.ts";
import type { Context } from "./context.ts";
import type { ExecutionGroups, Plan } from "./types/plan.ts";

export async function applyPlan(_: Context, plan: Plan): Promise<void> {

  const grouped = plan.reduce((acc, unit) => {
    (acc[unit.type] as ExecutionGroups[typeof unit.type]) = [...(acc[unit.type] ?? []), unit] as ExecutionGroups[typeof unit.type];
    return acc;
  }, {} as ExecutionGroups);

  logger.debug("Grouped", {
    grouped,
  });

  return await Promise.resolve();
}
