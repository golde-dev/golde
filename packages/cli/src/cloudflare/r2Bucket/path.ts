import { ensureAllKeys, prefixPath, removePrefix } from "../../utils/object.ts";
import type { BucketConfig, BucketState } from "./types.ts";

export const BASE_PATH = "cloudflare.r2";

export function r2BucketPath(name: string) {
  return prefixPath(BASE_PATH, name);
}

export function removeBucketPrefix(path: string) {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllKeys<BucketState>({
  createdAt: true,
  updatedAt: true,
  config: true,
  location: true,
  dependsOn: true,
});

const configAttributes = ensureAllKeys<BucketConfig>({
  locationHint: true,
  storageClass: true,
});
const configPaths = configAttributes.map((attribute) => `config.${attribute}`);
const possibleAttributes = [
  ...stateAttributes,
  ...configPaths,
];
const possibleAttributePattern = possibleAttributes.join("|");

const bucketNamePattern = `^(?:\\['(?<name>[A-Za-z0-9._-]+)'\\]|(?<name>[A-Za-z0-9_-]+))`;
const attributePattern = `(?:\\.(?<attributePath>${possibleAttributePattern}))?$`;

const pattern = new RegExp(bucketNamePattern + attributePattern);

export function matchR2Bucket(path: string): [string, string, string | null] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const groupPath = removeBucketPrefix(path);
  const match = pattern.exec(groupPath);

  if (!match) {
    throw new Error(`Incorrect Cloudflare R2 Bucket path: ${path}`);
  }
  const {
    groups: { name, attributePath = null } = {},
  } = match;

  return [
    r2BucketPath(name),
    name,
    attributePath,
  ];
}
