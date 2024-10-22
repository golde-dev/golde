import { logger } from "./logger.ts";
import type { Context } from "./types/context.ts";
import type { Plan } from "./types/plan.ts";

export async function applyPlan(_context: Context, _plan: Plan): Promise<void> {
  logger.debug("Grouped", {
    _plan,
  });

  return await Promise.resolve();
}
