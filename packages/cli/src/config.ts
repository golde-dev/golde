import { existsSync } from "fs";
import type { Config } from "./types/config";
import { validateConfig } from "./schema";
import logger from "./logger";
import { importDynamic, importTOML, importTS } from "./utils/module";
import { resolve, extname } from "path";
import { envTemplate, fileTemplate, gitTemplate, resolveTemplate } from "./utils/template";
import { ErrorCode } from "./constants/error";
import { CLIError } from "./error";
import type { Context } from "./context";
import { initializeContext } from "./context";

const loadConfig = async(path: string): Promise<{ config: unknown, path: string }> => {
  logger.debug(path, "Loading config");

  switch (extname(path)) {
    case ".cjs":
      return { config: require(path), path };
    case ".json":
      return { config: require(path), path };
    case ".js": {
      const { default: deployerConfig } = await importDynamic<{ default: Config }>(path);
      return { config: deployerConfig, path };
    }
    case ".ts": {
      const { default: deployerConfig } = await importTS<{ default: Config }>(path);
      return { config: deployerConfig, path };
    }
    case ".toml": {
      const deployerConfig = importTOML(path);
      return { config: deployerConfig, path };
    }
    default: 
      throw new Error("Unknown extension");
  }
};

const getConfig = async(path?: string): Promise<{ config: unknown, path: string }> => {
  if (path) {
    if (existsSync(resolve(path))) {
      return loadConfig(path);
    }
    else {
      throw new CLIError("Custom config missing", ErrorCode.NO_CUSTOM_CONFIG, path);
    }
  }
  const possiblePaths = [
    resolve("./deployer.config.cjs"),
    resolve("./deployer.config.json"), 
    resolve("./deployer.config.js"),
    resolve("./deployer.config.ts"),
    resolve("./deployer.toml"),
  ];

  for (const configPath of possiblePaths) {
    if (existsSync(configPath)) {
      return loadConfig(configPath);
    }
  }
  throw new CLIError("No config", ErrorCode.NO_CONFIG);
};

export const getAndValidateContext = async(configPath?: string): Promise<Context> => {
  try {
    const { config, path } = await getConfig(configPath);
    logger.debug({ config, path }, "Loaded config");

    const configWithEnv = resolveTemplate(config, envTemplate);
    logger.debug({ config: configWithEnv }, "Resolved env vars templates in config");

    const configWithFiles = resolveTemplate(configWithEnv, fileTemplate);
    logger.debug({ config: configWithEnv }, "Resolved files templates in config");

    const configWithGit = resolveTemplate(configWithFiles, gitTemplate);
    logger.debug({ config: configWithGit }, "Resolved git templates in config");

    validateConfig(configWithGit);
    logger.debug("Validated config with json schema");

    const context = await initializeContext(configWithGit);
    logger.debug("Context initialized");
    return context;
  }
  catch (error) {
    if (error instanceof CLIError) {
      switch (error.code) {
        case ErrorCode.NO_CONFIG:
          logger.error("Failed to find config, verify location or syntax");
          break;
        case ErrorCode.NO_CUSTOM_CONFIG:
          logger.error(`Failed to find config on path: ${error.cause as string}`);
          break;
        case ErrorCode.ENV_MISSING:
          logger.error(`Env variable is missing: ${error.cause as string}`);
          break;
        case ErrorCode.TEMPLATE_ERROR:
          logger.error(`Config template error: ${error.message}`);
          break;
        case ErrorCode.FILE_MISSING:
          logger.error(`File is missing: ${error.cause as string}`);
          break;
        case ErrorCode.GIT_MISSING:
          logger.error(`git variable is missing: ${error.cause as string}`);
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
    else {
      logger.error(error, "Unknown error");
    }
    process.exit(1);
  }
};
