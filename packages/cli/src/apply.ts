import { logger } from "./logger.ts";
import type { Context } from "./types/context.ts";
import type { Plan, Result } from "./types/plan.ts";

export async function applyChanges(_context: Context, _result: Result[]): Promise<void> {
}

export async function printResult(_result: Result[]): Promise<void> {
}

export async function executePlan(_context: Context, _plan: Plan): Promise<Result[]> {
  logger.debug("Grouped", {
    _plan,
  });

  return await Promise.resolve([]);
}
