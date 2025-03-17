import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../../utils/object.ts";
import type { BucketConfig, BucketState } from "./types.ts";

export const BASE_PATH = "cloudflare.r2.bucket";

export function r2BucketPath(name: string) {
  return prefixPath(BASE_PATH, name);
}

export function removeBucketPrefix(path: string) {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllowedKeys<BucketState>({
  createdAt: true,
  updatedAt: true,
  location: true,
});

const configAttributes = ensureAllowedKeys<BucketConfig>({
  locationHint: true,
  storageClass: true,
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const possibleAttributes = [
  ...stateAttributes,
  ...configAttributes,
];
const possibleAttributePattern = possibleAttributes.join("|");

const pattern = new RegExp(`^(?<name>.+)\\.(?<attributePath>${possibleAttributePattern})$`);

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
