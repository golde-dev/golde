import { matchHCloudServer } from "./resources/server/path.ts";

export function matchHCloudPath(path: string): [string, string, string] | undefined {
  if (!path.startsWith("hcloud.")) {
    return;
  }

  const match = matchHCloudServer(path);

  if (!match) {
    throw new Error(`Unable to match HCloud path: ${path}`);
  }
  return match;
}
