import { execSync } from "node:child_process";

export class GitClient {
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
