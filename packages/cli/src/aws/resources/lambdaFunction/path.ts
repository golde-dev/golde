import { ensureAllKeys, prefixPath, removePrefix } from "../../../utils/object.ts";
import type { FunctionState, ZipLambdaCode } from "./types.ts";
import type { ZipFunctionConfig } from "./types.ts";
import type { ImageFunctionConfig } from "./types.ts";
import type { ImageLambdaCode } from "./types.ts";

export const BASE_PATH = "aws.lambdaFunction";

export function lambdaFunctionPath(name: string) {
  return prefixPath(BASE_PATH, name);
}
export function removeFunctionPrefix(path: string) {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllKeys<FunctionState>({
  arn: true,
  createdAt: true,
  updatedAt: true,
  config: true,
  dependsOn: true,
});

const configAttributes = ensureAllKeys<ImageFunctionConfig | ZipFunctionConfig>({
  description: true,
  packageType: true,
  handler: true,
  runtime: true,
  timeout: true,
  roleArn: true,
  region: true,
  tags: true,
  memorySize: true,
  code: true,
});
const configPaths = configAttributes.map((attribute) => `config.${attribute}`);

const codeAttributes = ensureAllKeys<ZipLambdaCode | ImageLambdaCode>({
  imageUri: true,
  zipFile: true,
  s3Bucket: true,
  s3Key: true,
  s3ObjectVersion: true,
});
const codePaths = codeAttributes.map((attribute) => `config.code.${attribute}`);

export const possibleAttributes = [
  ...stateAttributes,
  ...configPaths,
  ...codePaths,
];
const possibleAttributePattern = possibleAttributes.join("|");

const namePattern = `^(?<name>[A-Za-z0-9_-]+)`;
const attributePattern = `(?:\\.(?<attributePath>${possibleAttributePattern}))?$`;

const pattern = new RegExp(namePattern + attributePattern);

export function matchLambdaFunction(path: string): [string, string, string | null] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const functionPath = removeFunctionPrefix(path);
  const match = pattern.exec(functionPath);

  if (!match) {
    throw new Error(`Incorrect AWS lambda function path: ${path}`);
  }
  const {
    groups: { name, attributePath = null } = {},
  } = match;

  return [
    lambdaFunctionPath(name),
    name,
    attributePath,
  ];
}
