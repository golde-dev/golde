import type { Resource, WithBranch } from "../types/config.ts";

export function assertBranch<T extends Resource = Resource>(
  config: T,
): asserts config is WithBranch<T> {
  if (!config.branch) {
    throw new Error("Branch is required");
  }
}
