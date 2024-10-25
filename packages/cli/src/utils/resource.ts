import { z } from "zod";
import type { Resource, WithBranch } from "../types/config.ts";
import { getBranchName, getDefaultBranch } from "../clients/git.ts";

export const branchSchema = z
  .string()
  .optional();

export const branchPatternSchema = z
  .string()
  .optional();

export function transformBranch<T extends Resource>(data: T): T {
  if (!data.branch && !data.branchPattern) {
    return {
      ...data,
      branch: getDefaultBranch(),
    };
  } else if (!data.branch && data.branchPattern) {
    return {
      ...data,
      branch: getBranchName(),
    };
  }
  return data;
}

export function assertBranch<T extends Resource = Resource>(
  config: T,
): asserts config is WithBranch<T> {
  if (!config.branch) {
    throw new Error("Branch is required");
  }
}
