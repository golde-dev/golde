import type { Context } from "./types/context.ts";
import type { Resource } from "@/types/dependencies.ts";
import type { Lock } from "./types/lock.ts";
import type { Plan } from "@/types/plan.ts";

export async function lockDependencies(
  _context: Context,
  _plan: Plan,
  _dependencies: Resource[],
): Promise<Lock[]> {
  return await Promise.resolve([]);
}

export async function releaseLocks(_context: Context, _locks: Lock[]): Promise<void> {
  return await Promise.resolve();
}
