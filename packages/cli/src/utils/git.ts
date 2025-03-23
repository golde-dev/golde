import slugify from "@sindresorhus/slugify";
import { execSync } from "node:child_process";
import { memoize } from "@es-toolkit/es-toolkit";
import { decode } from "./text.ts";
import { relative, resolve } from "node:path";

export interface GitInfo {
  defaultBranch: string;
  branchName: string;
  branchSlug: string;
  currentHash: string;
  currentTag?: string;
}

export const getDefaultBranch = memoize(() => {
  try {
    /**
     * This try to use github cli to get the default branch
     */
    return execSync("gh repo view --json defaultBranchRef --jq .defaultBranchRef.name")
      .toString()
      .trim() ?? "master";
  } catch {
    /**
     * This need be improved as it not always the case that remote is origin
     */
    return execSync("git symbolic-ref refs/remotes/origin/HEAD --short")
      .toString()
      .trim()
      .split("/")
      .at(1) ?? "master";
  }
});

export const getBranchName = memoize((revision: string = "HEAD") =>
  execSync(`git rev-parse --abbrev-ref ${revision}`)
    .toString()
    .trim()
);

export const getRefHash = memoize((revision: string = "HEAD") => {
  return execSync(`git rev-parse ${revision}`)
    .toString()
    .trim();
});

const getGitTopLevel = memoize(() => {
  return execSync(`git rev-parse --show-toplevel`)
    .toString()
    .trim();
});

export const getContextRefHash = memoize((context: string, revision: string = "HEAD") => {
  const path = resolve(context);
  const topLevel = getGitTopLevel();

  const relativePath = relative(topLevel, path);

  return execSync(`git rev-parse ${revision}:${relativePath}`)
    .toString()
    .trim();
});

export const getBranchSlug = memoize((revision: string = "HEAD") =>
  slugify(getBranchName(revision))
);

export const getGitInfo = memoize((branch?: string): GitInfo => {
  const defaultBranch = getDefaultBranch();
  const branchName = getBranchName(branch);
  const currentHash = getRefHash(branch);
  const branchSlug = getBranchSlug(branch);

  return {
    defaultBranch,
    branchName,
    currentHash,
    branchSlug,
  };
});

/**
 * Verify if git is installed
 */
export const verifyInstalled = async () => {
  try {
    const { success, stderr } = await new Deno.Command("git", {
      args: ["--version"],
    }).output();

    const stdErrDecoded = decode(stderr);
    if (!success) {
      throw new Error(
        `Failed to git version`,
        { cause: stdErrDecoded },
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("No such file or directory")) {
        throw new Error("Git is not installed", { cause: error });
      }
    }
    throw new Error("Failed to verify git install", { cause: error });
  }
};
