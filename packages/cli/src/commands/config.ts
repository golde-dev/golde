import { existsSync } from "fs";
import type { Config } from "../types/config";
import { validateConfig } from "../schema";
import logger from "../logger";
import { importDynamic, importTS } from "../utils/module";
import { resolve } from "path";
import { envTemplate, fileTemplate, resolveTemplate } from "../utils/template";
import { ErrorCode } from "../constants/error";
import { CLIError } from "../error";
import type { Context } from "../context";
import { initializeContext } from "../context";

const getConfig = async(): Promise<{ config: unknown, path: string }> => {
  const cjs = resolve("./deployer.config.cjs");
  if (existsSync(cjs)) {
    return { config: require(cjs), path: cjs };
  }
  const json = resolve("./deployer.config.json");
  if (existsSync(json)) {
    return { config: require(json), path: json };
  }
  const js = resolve("./deployer.config.js");
  if (existsSync(js)) {
    const { default: deployerConfig } = await importDynamic<{ default: Config }>(js);
    return { config: deployerConfig, path: js };
  }
  const ts = resolve("./deployer.config.ts");
  if (existsSync(ts)) {
    const { default: deployerConfig } = await importTS<{ default: Config }>(ts);
    return { config: deployerConfig, path: ts };
  }

  throw new CLIError("No config", ErrorCode.NO_CONFIG);
};

export const getAndValidateContext = async(): Promise<Context> => {
  try {
    const { config, path } = await getConfig();
    logger.debug({ config, path }, "Loaded config");

    const configWithEnv = resolveTemplate(config, envTemplate);
    logger.debug({ config: configWithEnv }, "Resolved env vars templates in config");


    const configWithFiles = resolveTemplate(configWithEnv, fileTemplate);
    logger.debug({ config: configWithEnv }, "Resolved files templates in config");

    validateConfig(configWithFiles);
    logger.debug("Validated config with json schema");

    const context = await initializeContext(configWithFiles);
    logger.debug("Context initialized");
    return context;
  }
  catch (error) {
    if (error instanceof CLIError) {
      switch (error.code) {
        case ErrorCode.NO_CONFIG:
          logger.error("Failed to load config, verify location or syntax");
          break;

        case ErrorCode.ENV_MISSING:
          logger.error(`File is missing: ${error.cause as string}`);
          break;
        case ErrorCode.TEMPLATE_ERROR:
          logger.error(`Config template error: ${error.message}`);
          break;
        case ErrorCode.FILE_MISSING:
          logger.error(`File is missing: ${error.cause as string}`);
          break;
        case ErrorCode.INVALID_CONFIG:
          logger.error(error.cause, "Config failed validation");
          break;
        case ErrorCode.PROVIDER_INIT_ERROR:
          logger.error(`Providers initialization failed: ${error.message}`);
          break;
        default:
          logger.error(`Configuration error: ${error.message}`);
      }
    }
    process.exit(1);
  }
};
