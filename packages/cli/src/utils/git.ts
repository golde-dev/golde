import { execSync } from "node:child_process";

export const getBranchName = () =>
  execSync("git rev-parse --abbrev-ref HEAD")
    .toString()
    .trim();

export const getCurrentHash = () =>
  execSync("git rev-parse HEAD")
    .toString()
    .trim();

export const getBranchSlug = () =>
  execSync("git rev-parse --abbrev-ref HEAD")
    .toString()
    .trim()
    .replaceAll(" ", "-")
    .replaceAll("/", "-");

export const getGitInfo = () => {
  const branchName = getBranchName();
  const currentHash = getCurrentHash();
  const branchSlug = getBranchSlug();

  return {
    branchName,
    currentHash,
    branchSlug,
  };
};
