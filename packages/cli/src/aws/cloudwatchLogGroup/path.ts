import { ensureAllKeys, prefixPath, removePrefix } from "../../utils/object.ts";
import type { LogGroupConfig, LogGroupState } from "./types.ts";

export const BASE_PATH = "aws.cloudwatchLogGroup";

export function cloudwatchLogGroupPath(name: string) {
  return prefixPath(BASE_PATH, name);
}
export function removeLogGroupPrefix(path: string) {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllKeys<LogGroupState>({
  "arn": true,
  "createdAt": true,
  "updatedAt": true,
  "config": true,
});

const configAttributes = ensureAllKeys<LogGroupConfig>({
  "retentionInDays": true,
  "tags": true,
});

const configPaths = configAttributes.map((attribute) => `config.${attribute}`);
const possibleAttributes = [
  ...stateAttributes,
  ...configPaths,
];
const possibleAttributePattern = possibleAttributes.join("|");

const logGroupPattern = `^(?:\\['(?<logGroup>[A-Za-z0-9._-]+)'\\]|(?<logGroup>[A-Za-z0-9_-]+))`;
const attributePattern = `(?:\\.(?<attributePath>${possibleAttributePattern}))?$`;

const pattern = new RegExp(logGroupPattern + attributePattern);

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
    groups: { logGroup, attributePath = null } = {},
  } = match;

  return [
    cloudwatchLogGroupPath(logGroup),
    logGroup,
    attributePath,
  ];
}
