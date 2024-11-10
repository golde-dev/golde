import { logger } from "./logger.ts";
import type { Context } from "./types/context.ts";
import type { Dependencies } from "./types/dependencies.ts";
import type { Plan } from "./types/plan.ts";

export function getDependencies(
  _context: Context,
  _plan: Plan,
): Promise<Dependencies> {
  logger.info("[Dependencies] Resolving dependencies");
  return Promise.resolve({});
}
