/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { existsSync, readFileSync } from "fs";
import type { Config } from "../types/config";
import { validateConfig } from "../schema";
import logger from "../logger";
import { importDynamic, importTS } from "../utils/module";
import { resolve } from "path";


const getConfig = async(): Promise<Config> => {
  const cjs = resolve("./deployer.config.cjs");
  if (existsSync(cjs)) {
    return require(cjs) as Config;
  }
  const json = resolve("./deployer.config.json");
  if (existsSync(json)) {
    return require(json) as Config;
  }
  const js = resolve("./deployer.config.js");
  if (existsSync(js)) {
    const { default: deployerConfig } = await importDynamic<{ default: Config }>(js);
    return deployerConfig;
  }
  const ts = resolve("./deployer.config.ts");
  if (existsSync(ts)) {
    const { default: deployerConfig } = await importTS<{ default: Config }>(ts);
    return deployerConfig;
  }

  throw new Error("No config");
};


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
    throw new Error("Symbols are not permitted");
  }
  else if (typeof value === "function") {
    throw new Error("Functions are not permitted");
  }
  else if (value instanceof Set) {
    throw new Error("Set is not permitted");
  }
  else if (value instanceof Map) {
    throw new Error("Map is not permitted");
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

const envTemplate = (value: string): string => {
  const match = envRe.exec(value);
  if (match) {
    const [variableName] = match;

    if (process.env[variableName]) {
      return process.env[variableName]!;
    }
    else {
      throw new Error("Env variable is missing", { cause: variableName });
    }
  }
  return value;
};
const fileRe = new RegExp(/(?<=file\()(.*)(?=\))/);

const fileTemplate = (value: string): string => {
  const match = fileRe.exec(value);
  if (match) {
    const [fileName] = match;

    if (existsSync(fileName)) {
      return readFileSync(fileName, { encoding: "utf8" });
    }
    else {
      throw new Error("Template file is missing", { cause: fileName });
    }
  }
  return value;
};

export const getAndValidateConfig = async(): Promise<Config> => {
  try {
    const deployerConfig = await getConfig();

    const configWithEnv = resolveTemplate(deployerConfig, envTemplate);
    const configWithFiles = resolveTemplate(configWithEnv, fileTemplate);

    validateConfig(configWithFiles);

    return configWithFiles;
  }
  catch (error) {
    if (error instanceof Error) {
      if (error.message === "No config") {
        logger.error({ error }, "Failed to load config, verify location or syntax");
      }
      else if (error.message === "Failed schema validation") {
        logger.error(error.cause, "Config failed validation");
      }
      else if (error.message === "Env variable is missing") {
        logger.error(`Env variable is missing: ${error.cause as string}`);
      }
      else if (error.message === "Template file is missing") {
        logger.error(`Template file is missing: ${error.cause as string}`);
      }
      else {
        logger.error(`Invalid config: ${error.message}`);
      }
    }
    process.exit(1);
  }
};
