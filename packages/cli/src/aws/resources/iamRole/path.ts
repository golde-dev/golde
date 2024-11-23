import { ensureAllKeys, prefixPath, removePrefix } from "../../../utils/object.ts";
import type { RoleConfig, RoleState } from "./types.ts";

export const BASE_PATH = "aws.iamRole";

export function iamRolePath(name: string) {
  return prefixPath(BASE_PATH, name).trim();
}
export function removeRolePrefix(path: string) {
  return removePrefix(BASE_PATH, path).trim();
}

const stateAttributes = ensureAllKeys<RoleState>({
  arn: true,
  createdAt: true,
  updatedAt: true,
  config: true,
  dependsOn: true,
});

const configAttributes = ensureAllKeys<RoleConfig>({
  path: true,
  description: true,
  permissionsBoundaryArn: true,
  inlinePolicy: true,
  assumeRolePolicy: true,
  managedPoliciesArns: true,
});

const configPaths = configAttributes.map((attr) => `config.${attr}`);

export const possibleAttributes = [
  ...stateAttributes,
  ...configPaths,
];

const possibleAttributePattern = possibleAttributes.join("|");

const namePattern = `^(?:\\['(?<name>[A-Za-z0-9._-]+)'\\]|(?<name>[A-Za-z0-9_-]+))`;
const attributePattern = `(?:\\.(?<attributePath>${possibleAttributePattern}))?$`;

const pattern = new RegExp(namePattern + attributePattern);

export function matchIAMRole(path: string): [string, string, string | null] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const rolePath = removeRolePrefix(path);

  const match = pattern.exec(rolePath);
  if (!match) {
    throw new Error(`Incorrect AWS IAM role path: ${path}`);
  }
  const {
    groups: { name, attributePath = null } = {},
  } = match;

  return [
    iamRolePath(name),
    name,
    attributePath,
  ];
}
