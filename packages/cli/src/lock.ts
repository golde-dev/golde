import type { Context } from "./types/context.ts";
import type { Dependencies } from "./types/dependencies.ts";
import type { Lock } from "./types/lock.ts";

export async function lockDependencies(
  _context: Context,
  _dependencies: Dependencies,
): Promise<Lock[]> {
  return await Promise.resolve([]);
}

export async function releaseLocks(_context: Context, _locks: Lock[]): Promise<void> {
  return await Promise.resolve();
}
