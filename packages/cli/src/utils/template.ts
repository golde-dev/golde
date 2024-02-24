/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { existsSync, readFileSync } from "fs";
import { CLIError } from "../error";
import { ErrorCode } from "../constants/error";

const templateRe = new RegExp(/(?<={{\s)(.*)(?=\s}})/);

export const resolveTemplate = (value: unknown, onTemplate: (value: string) => string): unknown => {
  if (
    value === undefined ||
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "bigint"
  ) {
    return value;
  }
  else if (typeof value === "string") {
    const match = templateRe.exec(value);
    if (match) {
      const [template] = match;
      return onTemplate(template);
    }
    else {
      return value;
    }
  }
  else if (typeof value === "symbol") {
    throw new CLIError("Symbols are not permitted", ErrorCode.TEMPLATE_ERROR);
  }
  else if (typeof value === "function") {
    throw new CLIError("Functions are not permitted", ErrorCode.TEMPLATE_ERROR);
  }
  else if (value instanceof Set) {
    throw new CLIError("Set is not permitted", ErrorCode.TEMPLATE_ERROR);
  }
  else if (value instanceof Map) {
    throw new CLIError("Map is not permitted",  ErrorCode.TEMPLATE_ERROR);
  }
  else if (value instanceof Array) {
    return value.map((val) => resolveTemplate(val, onTemplate));
  }
  else if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record).reduce((current: object, key: string) => {
      return {
        ...current,
        [key]: resolveTemplate(record[key], onTemplate),
      };
    }, {});
  }
  else {
    return value;
  }
};

const envRe = new RegExp(/(?<=env.)(.*)/);

export const envTemplate = (value: string): string => {
  const match = envRe.exec(value);
  if (match) {
    const [variableName] = match;

    if (process.env[variableName]) {
      return process.env[variableName]!;
    }
    else {
      throw new CLIError("Env variable is missing", ErrorCode.ENV_MISSING, variableName);
    }
  }
  return value;
};
const fileRe = new RegExp(/(?<=file\()(.*)(?=\))/);

export const fileTemplate = (value: string): string => {
  const match = fileRe.exec(value);
  if (match) {
    const [fileName] = match;

    if (existsSync(fileName)) {
      return readFileSync(fileName, { encoding: "utf8" });
    }
    else {
      throw new CLIError("Template file is missing", ErrorCode.FILE_MISSING, fileName);
    }
  }
  return value;
};