import { matchHCloudServer } from "./resources/server/path.ts";
import { matchHCloudSSHKey } from "./resources/sshKey/path.ts";

export function matchHCloudPath(path: string): [string, string, string] | undefined {
  if (!path.startsWith("hcloud.")) {
    return;
  }

  const match = matchHCloudServer(path) ?? matchHCloudSSHKey(path);

  if (!match) {
    throw new Error(`Unable to match HCloud path: ${path}`);
  }
  return match;
}
