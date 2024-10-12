import { GitClient } from "../clients/git.ts";
import { logger } from "../logger.ts";

export async function createGitClient(): Promise<GitClient> {
  const git = new GitClient();

  try {
    await git.verifyInstalled();
    return git;
  } catch (error) {
    logger.error(
      "Failed to initialize git",
      { error },
    );
    throw error;
  }
}
