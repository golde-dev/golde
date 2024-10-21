import { z } from "zod";
import type { Resource, WithBranch } from "../types/config.ts";
import { getDefaultBranch } from "../clients/git.ts";

const main = getDefaultBranch();

export const branchSchema = z
  .string()
  .default(main)
  .optional();

export const branchPatternSchema = z
  .string()
  .optional();

export function assertBranch<T extends Resource = Resource>(
  config: T,
): asserts config is WithBranch<T> {
  if (!config.branch) {
    throw new Error("Branch is required");
  }
}
