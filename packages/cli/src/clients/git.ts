import { execSync } from "node:child_process";
import { memoize } from "moderndash";

const decoder = new TextDecoder();

export interface GitInfo {
  defaultBranch: string;
  branchName: string;
  branchSlug: string;
  currentHash: string;
  currentTag?: string;
  localRefs: {
    [branch: string]: string;
  };
  remoteRefs: {
    [branch: string]: string;
  };
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

export const getRefHash = memoize((revision: string = "HEAD") =>
  execSync(`git rev-parse ${revision}`)
    .toString()
    .trim()
);

export const getBranchSlug = memoize((revision: string = "HEAD") =>
  getBranchName(revision)
    .replaceAll(" ", "-")
    .replaceAll("/", "-")
);

export class GitClient {
  /**
   * Check if git is installed
   */
  public async verifyInstalled() {
    try {
      const { success, stderr } = await new Deno.Command("git", {
        args: ["--version"],
      }).output();

      const stdErrDecoded = decoder.decode(stderr);
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
  }

  public getGitInfo = memoize((): GitInfo => {
    const defaultBranch = this.getDefaultBranch();
    const branchName = this.getBranchName();
    const currentHash = this.getRefHash();
    const branchSlug = this.getBranchSlug();

    return {
      defaultBranch,
      branchName,
      currentHash,
      branchSlug,
      localRefs: {},
      remoteRefs: {},
    };
  });

  public getDefaultBranch = getDefaultBranch;
  public getBranchName = getBranchName;
  public getRefHash = getRefHash;
  public getBranchSlug = getBranchSlug;
}
