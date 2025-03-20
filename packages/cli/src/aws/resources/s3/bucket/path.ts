import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../../utils/object.ts";
import type { BucketConfig, BucketState } from "./types.ts";
import { PlanError, PlanErrorCode } from "@/error.ts";

export const BASE_PATH = "aws.s3.bucket";

export function s3BucketPath(name: string) {
  return prefixPath(BASE_PATH, name);
}

export function removeBucketPrefix(path: string) {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllowedKeys<BucketState>({
  createdAt: true,
  updatedAt: true,
  arn: true,
  name: true,
});

const configAttributes = ensureAllowedKeys<BucketConfig>({
  region: true,
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const possibleAttributes = [
  ...stateAttributes,
  ...configAttributes,
];

const possibleAttributePattern = possibleAttributes.join("|");
const pattern = new RegExp(`^(?<name>.+)\\.(?<attributePath>${possibleAttributePattern})$`);

export function matchS3Bucket(path: string): [string, string, string] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const bucketPath = removeBucketPrefix(path);
  const match = pattern.exec(bucketPath);

  if (!match) {
    throw new PlanError(`Incorrect AWS Bucket path: ${path}`, PlanErrorCode.INCORRECT_PATH);
  }
  const {
    groups: { name, attributePath } = {},
  } = match;

  return [
    s3BucketPath(name),
    name,
    attributePath,
  ];
}
