import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../utils/object.ts";
import { PlanError, PlanErrorCode } from "../../../error.ts";
import type { SSHKeyConfig, SSHKeyState } from "./types.ts";

export const BASE_PATH = "hcloud.sshKey";

export function sshKeyPath(name: string): string {
  return prefixPath(BASE_PATH, name);
}

export function removeSshKeyPrefix(path: string): string {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllowedKeys<SSHKeyState>({
  id: true,
  name: true,
  fingerprint: true,
  publicKey: true,
  createdAt: true,
  updatedAt: true,
});

// Exclude `publicKey` from the config schema because it overlaps with the state
type SSHKeyConfigAttributes = Pick<SSHKeyConfig, "branch" | "branchPattern">;

const configAttributes = ensureAllowedKeys<SSHKeyConfigAttributes>({
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const possibleAttributes = [
  ...stateAttributes,
  ...configAttributes,
];
const possibleAttributePattern = possibleAttributes.join("|");

const pattern = new RegExp(
  `^(?<name>.+)\\.(?<attributePath>${possibleAttributePattern})$`,
);

export function matchHCloudSSHKey(path: string): [string, string, string] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const rest = removeSshKeyPrefix(path);
  const match = pattern.exec(rest);

  if (!match) {
    throw new PlanError(
      `Incorrect HCloud SSH Key path: ${path}`,
      PlanErrorCode.INCORRECT_PATH,
    );
  }
  const { groups: { name, attributePath } = {} } = match;

  return [
    sshKeyPath(name),
    name,
    attributePath,
  ];
}
