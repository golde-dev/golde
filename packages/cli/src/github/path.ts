import { matchRegistryDockerImagePath } from "./resources/registry/dockerImage/path.ts";

export function matchGithubPath(path: string): [string, string, string] | undefined {
  if (!path.startsWith("github.")) {
    return;
  }

  const match = matchRegistryDockerImagePath(path);
  if (!match) {
    throw new Error(`Unable to match Github path: ${path}`);
  }
  return match;
}
