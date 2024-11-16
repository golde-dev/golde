import { logger } from "./logger.ts";
import type { Context } from "./types/context.ts";
import type { Dependencies } from "./types/dependencies.ts";
import type { Plan } from "./types/plan.ts";

function configDependencies<C extends object>(_config: C): string[] {
  return [];
}

export function getDependencies(
  _context: Context,
  _plan: Plan,
  print = false,
): Promise<Dependencies> {
  if (print) {
    logger.info("[Dependencies] Resolving dependencies");
  }
  return Promise.resolve({});
}
