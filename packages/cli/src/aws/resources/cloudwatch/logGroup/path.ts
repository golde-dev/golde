import { ensureAllKeys, prefixPath, removePrefix } from "../../../../utils/object.ts";
import type { LogGroupConfig, LogGroupState } from "./types.ts";

export const BASE_PATH = "aws.cloudwatchLogGroup";

export function cloudwatchLogGroupPath(name: string) {
  return prefixPath(BASE_PATH, name).trim();
}
export function removeLogGroupPrefix(path: string) {
  return removePrefix(BASE_PATH, path).trim();
}

const stateAttributes = ensureAllKeys<LogGroupState>({
  arn: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  config: true,
  dependsOn: true,
});

const configAttributes = ensureAllKeys<LogGroupConfig>({
  retentionInDays: true,
  tags: true,
});

const configPaths = configAttributes.map((attribute) => `config.${attribute}`);
const possibleAttributes = [
  ...stateAttributes,
  ...configPaths,
];
const possibleAttributePattern = possibleAttributes.join("|");

const namePattern = `^(?:\\['(?<name>[A-Za-z0-9._\/-]+)'\\]|(?<name>[A-Za-z0-9_\/-]+))`;
const attributePattern = `(?:\\.(?<attributePath>${possibleAttributePattern}))?$`;

const pattern = new RegExp(namePattern + attributePattern);

export function matchCloudwatchLogGroup(path: string): [string, string, string | null] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const groupPath = removeLogGroupPrefix(path);
  const match = pattern.exec(groupPath);

  if (!match) {
    throw new Error(`Incorrect AWS Cloudwatch Log Group path: ${path}`);
  }
  const {
    groups: { name, attributePath = null } = {},
  } = match;

  return [
    cloudwatchLogGroupPath(name),
    name,
    attributePath,
  ];
}
