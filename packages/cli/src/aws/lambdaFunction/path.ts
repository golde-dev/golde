import type { FunctionState } from "./types.ts";
import type { ZipFunctionConfigState } from "./types.ts";
import type { ImageFunctionConfig } from "./types.ts";
import type { S3LambdaCode } from "./types.ts";
import type { ImageLambdaCode } from "./types.ts";
import type { ZipFileLambdaCodeHash } from "./types.ts";

export const BASE_PATH = "state.aws.lambdaFunction";
export const BASE_PATH_DOT = "state.aws.lambdaFunction.";

export function lambdaFunctionPath(name: string) {
  return `${BASE_PATH}.${name}`;
}
export function removeFunctionPrefix(path: string) {
  return path.replace(BASE_PATH_DOT, "");
}

type StateAttr = keyof FunctionState;
const stateAttributes: StateAttr[] = [
  "arn",
  "createdAt",
  "updatedAt",
  "config",
];

type ConfigAttr = keyof ImageFunctionConfig | keyof ZipFunctionConfigState;
const configAttributes: ConfigAttr[] = [
  "description",
  "packageType",
  "handler",
  "runtime",
  "timeout",
  "roleArn",
  "region",
  "tags",
  "memorySize",
  "code",
];
const configPaths = configAttributes.map((attribute) => `config.${attribute}`);

type CodeAttr = keyof ImageLambdaCode | keyof S3LambdaCode | keyof ZipFileLambdaCodeHash;
const codeAttributes: CodeAttr[] = [
  "imageUri",
  "zipFile",
  "s3Bucket",
  "s3Key",
  "s3ObjectVersion",
];
const codePaths = codeAttributes.map((attribute) => `config.code.${attribute}`);

export const possibleAttributes = [
  ...stateAttributes,
  ...configPaths,
  ...codePaths,
];
const possibleAttributePattern = possibleAttributes.join("|");

const functionNamePattern = `^(?<functionName>[A-Za-z0-9_-]+)`;
const attributePattern = `(?:\\.(?<attributePath>${possibleAttributePattern}))?$`;

const pattern = new RegExp(functionNamePattern + attributePattern);

export function matchLambdaFunction(path: string): [string, string | null] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const functionPath = removeFunctionPrefix(path);
  const match = pattern.exec(functionPath);

  if (!match) {
    throw new Error(`Incorrect AWS lambda function path: ${path}`);
  }
  const {
    groups: { functionName, attributePath = null } = {},
  } = match;

  return [
    functionName,
    attributePath,
  ];
}
