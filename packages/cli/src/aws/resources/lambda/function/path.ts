import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../../utils/object.ts";
import type { FunctionState, ZipLambdaCode } from "./types.ts";
import type { ZipFunctionConfig } from "./types.ts";
import type { ImageLambdaCode } from "./types.ts";

export const BASE_PATH = "aws.lambda.function";

export function lambdaFunctionPath(name: string) {
  return prefixPath(BASE_PATH, name);
}
export function removeFunctionPrefix(path: string) {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllowedKeys<FunctionState>({
  arn: true,
  createdAt: true,
  updatedAt: true,
});

const configAttributes = ensureAllowedKeys<ZipFunctionConfig>({
  description: true,
  packageType: true,
  handler: true,
  runtime: true,
  timeout: true,
  roleArn: true,
  region: true,
  memorySize: true,
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const codeAttributes = ensureAllowedKeys<ZipLambdaCode | ImageLambdaCode>({
  imageUri: true,
  zipFile: true,
  s3Bucket: true,
  s3Key: true,
  s3ObjectVersion: true,
}).map((attribute) => `config.code.${attribute}`);

const possibleAttributes = [
  ...stateAttributes,
  ...configAttributes,
  ...codeAttributes,
];
const possibleAttributePattern = possibleAttributes.join("|");

const pattern = new RegExp(`^(?<name>.+)\\.(?<attributePath>${possibleAttributePattern})$`);

export function matchLambdaFunction(path: string): [string, string, string] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const functionPath = removeFunctionPrefix(path);
  const match = pattern.exec(functionPath);

  if (!match) {
    throw new Error(`Incorrect AWS lambda function path: ${path}`);
  }
  const {
    groups: { name, attributePath } = {},
  } = match;

  return [
    lambdaFunctionPath(name),
    name,
    attributePath,
  ];
}
