import { ensureAllKeys, prefixPath, removePrefix } from "../../utils/object.ts";
import type { BucketConfig, BucketState } from "./types.ts";

export const BASE_PATH = "aws.s3Bucket";

export function s3BucketPath(name: string) {
  return prefixPath(BASE_PATH, name);
}

export function removeBucketPrefix(path: string) {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllKeys<BucketState>({
  createdAt: true,
  updatedAt: true,
  arn: true,
  config: true,
  dependsOn: true,
});

const configAttributes = ensureAllKeys<BucketConfig>({
  "region": true,
  "tags": true,
});
const configPaths = configAttributes.map((attribute) => `config.${attribute}`);
const possibleAttributes = [
  ...stateAttributes,
  ...configPaths,
];
const possibleAttributePattern = possibleAttributes.join("|");

const bucketNamePattern =
  `^(?:\\['(?<bucketName>[A-Za-z0-9._-]+)'\\]|(?<bucketName>[A-Za-z0-9_-]+))`;
const attributePattern = `(?:\\.(?<attributePath>${possibleAttributePattern}))?$`;

const pattern = new RegExp(bucketNamePattern + attributePattern);

export function matchS3Bucket(path: string): [string, string, string | null] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const groupPath = removeBucketPrefix(path);
  const match = pattern.exec(groupPath);

  if (!match) {
    throw new Error(`Incorrect AWS Bucket path: ${path}`);
  }
  const {
    groups: { bucketName, attributePath = null } = {},
  } = match;

  return [
    s3BucketPath(bucketName),
    bucketName,
    attributePath,
  ];
}
