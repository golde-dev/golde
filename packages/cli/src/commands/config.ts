import { existsSync } from "fs";
import type { Config } from "../types/config";
import { validateConfig } from "../schema";
import logger from "../logger";
import { importDynamic, importTS } from "../utils/module";
import { cwd } from "process";

const getConfig = async(): Promise<Config> => {
  const pwd = cwd();

  if (existsSync(`${pwd}/deployer.config.cjs`)) {
    return require(`${pwd}/deployer.config.cjs`) as Config;
  }
  if (existsSync(`${pwd}/deployer.config.json`)) {
    return require(`${pwd}/deployer.config.json`) as Config;
  }
  if (existsSync(`${pwd}/deployer.config.js`)) {
    const { default: deployerConfig } = await importDynamic<{ default: Config }>(`${pwd}/deployer.config.js`);
    return deployerConfig;
  }
  if (existsSync("./deployer.config.ts")) {
    const { default: deployerConfig } = await importTS<{ default: Config }>(`${pwd}/deployer.config.ts`);
    return deployerConfig;
  }

  throw new Error("No config");
};


export const resolveTemplate = (value: unknown, onTemplate: (value: string) => string): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{{") && trimmed.endsWith("}}")) {
      return onTemplate(trimmed);
    }
    else {
      return value;
    }
  }
  else if (
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "bigint") {
    return value;
  }
  else if (typeof value === "symbol") {
    throw new Error("Symbols not permitted");
  }
  else if (typeof value === "function") {
    throw new Error("Functions not permitted");
  }
  else if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map((val) => resolveTemplate(val, onTemplate));
    }

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

const envTemplate = (value: string): string => {
  return value;
};

const fileTemplate = (value: string): string => {
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
      else if (error.message === "File is missing") {
        logger.error(`File is missing: ${error.cause as string}`);
      } 
      else {
        logger.error(`Invalid config: ${error.message}`); 
      }
    }
    process.exit(1);
  }
};
