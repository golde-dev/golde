import type { Context } from "./types/context.ts";
import type { Dependencies } from "./types/dependencies.ts";
import type { Lock } from "./types/lock.ts";

export async function lockDependencies(
  context: Context,
  dependacies: Dependencies,
): Promise<Lock[]> {
  return Promise.resolve([]);
}

export async function releaseLocks(context: Context, locks: Lock[]): Promise<void> {
}
