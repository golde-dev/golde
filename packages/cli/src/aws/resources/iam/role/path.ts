import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../../utils/object.ts";
import type { RoleConfig, RoleState } from "./types.ts";

export const BASE_PATH = "aws.iam.role";

export function iamRolePath(name: string) {
  return prefixPath(BASE_PATH, name).trim();
}
export function removeRolePrefix(path: string) {
  return removePrefix(BASE_PATH, path).trim();
}

const stateAttributes = ensureAllowedKeys<RoleState>({
  arn: true,
  createdAt: true,
  updatedAt: true,
});

const configAttributes = ensureAllowedKeys<RoleConfig>({
  path: true,
  description: true,
  permissionsBoundaryArn: true,
  branch: true,
  branchPattern: true,
}).map((attr) => `config.${attr}`);

export const possibleAttributes = [
  ...stateAttributes,
  ...configAttributes,
];

const possibleAttributePattern = possibleAttributes.join("|");

const pattern = new RegExp(`^(?<name>.+)\\.(?<attributePath>${possibleAttributePattern})$`);

export function matchIAMRole(path: string): [string, string, string] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const rolePath = removeRolePrefix(path);

  const match = pattern.exec(rolePath);
  if (!match) {
    throw new Error(`Incorrect AWS IAM role path: ${path}`);
  }
  const {
    groups: { name, attributePath } = {},
  } = match;

  return [
    iamRolePath(name),
    name,
    attributePath,
  ];
}
