import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../../utils/object.ts";
import type { LogGroupConfig, LogGroupState } from "./types.ts";

export const BASE_PATH = "aws.cloudwatchLogGroup";

export function cloudwatchLogGroupPath(name: string) {
  return prefixPath(BASE_PATH, name).trim();
}
export function removeLogGroupPrefix(path: string) {
  return removePrefix(BASE_PATH, path).trim();
}

const stateAttributes = ensureAllowedKeys<LogGroupState>({
  arn: true,
  name: true,
  createdAt: true,
  updatedAt: true,
});

const configAttributes = ensureAllowedKeys<LogGroupConfig>({
  retentionInDays: true,
  branchPattern: true,
  branch: true,
  region: true,
}).map((attribute) => `config.${attribute}`);

const possibleAttributes = [
  ...stateAttributes,
  ...configAttributes,
];
const possibleAttributePattern = possibleAttributes.join("|");

const pattern = new RegExp(`^(?<name>.+)\\.(?<attributePath>${possibleAttributePattern})$`);

export function matchCloudwatchLogGroup(path: string): [string, string, string] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const groupPath = removeLogGroupPrefix(path);
  const match = pattern.exec(groupPath);

  if (!match) {
    throw new Error(`Incorrect AWS Cloudwatch Log Group path: ${path}`);
  }
  const {
    groups: { name, attributePath } = {},
  } = match;

  return [
    cloudwatchLogGroupPath(name),
    name,
    attributePath,
  ];
}
