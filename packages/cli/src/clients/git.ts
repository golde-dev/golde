import { execSync } from "node:child_process";

const decoder = new TextDecoder();

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

  getBranchName = () =>
    execSync("git rev-parse --abbrev-ref HEAD")
      .toString()
      .trim();

  getCurrentHash = () =>
    execSync("git rev-parse HEAD")
      .toString()
      .trim();

  getBranchSlug = () =>
    execSync("git rev-parse --abbrev-ref HEAD")
      .toString()
      .trim()
      .replaceAll(" ", "-")
      .replaceAll("/", "-");
}
