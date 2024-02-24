import { existsSync } from "fs";
import type { Config } from "../types/config";
import { validateConfig } from "../schema";
import logger from "../logger";
import { importDynamic, importTS } from "../utils/module";
import { resolve } from "path";
import { envTemplate, fileTemplate, resolveTemplate } from "../utils/template";
import { ErrorCode } from "../constants/error";
import { CLIError } from "../error";
import type { Context} from "../context";
import { initializeContext } from "../context";

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

  throw new CLIError("No config", ErrorCode.NO_CONFIG);
};

export const getAndValidateConfig = async(): Promise<Context> => {
  try {
    const deployerConfig = await getConfig();

    const configWithEnv = resolveTemplate(deployerConfig, envTemplate);
    const configWithFiles = resolveTemplate(configWithEnv, fileTemplate);

    validateConfig(configWithFiles);

    return await initializeContext(configWithFiles);
  }
  catch (error) {
    if (error instanceof CLIError) {
      if (error.code === ErrorCode.NO_CONFIG) {
        logger.error("Failed to load config, verify location or syntax");
      }
      else if (error.code === ErrorCode.INVALID_CONFIG) {
        logger.error(error.cause, "Config failed validation");
      }
      else if (error.code === ErrorCode.ENV_MISSING) {
        logger.error(`Env variable is missing: ${error.cause as string}`);
      }
      else if (error.code === ErrorCode.TEMPLATE_ERROR) {
        logger.error(`Config template error: ${error.message}`);
      }
      else if (error.code === ErrorCode.FILE_MISSING) {
        logger.error(`File is missing: ${error.cause as string}`);
      }
      else {
        logger.error(`Invalid config: ${error.message}`);
      }
    }
    else if (error instanceof Error) {
      logger.error(`Invalid config: ${error.message}`);
    }
    process.exit(1);
  }
};
