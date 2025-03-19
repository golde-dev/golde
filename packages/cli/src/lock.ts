import type { Context } from "./types/context.ts";
import type { Dependency } from "@/types/dependencies.ts";
import type { Lock } from "./types/lock.ts";
import type { Plan } from "@/types/plan.ts";

export async function lockDependencies(
  _context: Context,
  _plan: Plan,
  _dependencies: Dependency[],
): Promise<Lock[]> {
  return await Promise.resolve([]);
}

export async function releaseLocks(_context: Context, _locks: Lock[]): Promise<void> {
  return await Promise.resolve();
}
