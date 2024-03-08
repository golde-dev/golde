import { existsSync } from "fs";
import type { Config } from "./types/config";
import { validateConfig } from "./schema";
import logger from "./logger";
import { importDynamic, importTOML, importTS } from "./utils/module";
import { resolve, extname } from "path";
import { envTemplate, fileTemplate, gitTemplate, resolveTemplate } from "./utils/template";
import { ConfigError, ConfigErrorCode } from "./error";

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

const getConfigRaw = async(path?: string): Promise<{ config: unknown, path: string }> => {
  if (path) {
    if (existsSync(resolve(path))) {
      return loadConfig(path);
    }
    else {
      throw new ConfigError(`Failed to find custom config at path: ${path}`, ConfigErrorCode.NO_CUSTOM_CONFIG, path);
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
  throw new ConfigError("Failed to find config, please verify the location or syntax", ConfigErrorCode.NO_CONFIG);
};

export const getConfig = async(configPath?: string): Promise<Config> => {
  try {
    const { config, path } = await getConfigRaw(configPath);
    logger.debug({ config, path }, "Loaded config");

    const configWithEnv = resolveTemplate(config, envTemplate);
    logger.debug({ config: configWithEnv }, "Resolved env vars templates in config");

    const configWithFiles = resolveTemplate(configWithEnv, fileTemplate);
    logger.debug({ config: configWithEnv }, "Resolved files templates in config");

    const configWithGit = resolveTemplate(configWithFiles, gitTemplate);
    logger.debug({ config: configWithGit }, "Resolved git templates in config");

    validateConfig(configWithGit);
    logger.debug("Validated config with json schema");

    return configWithGit;
  }
  catch (error) {
    if (error instanceof ConfigError) {
      switch (error.code) {
        case ConfigErrorCode.NO_CONFIG:
          logger.error("Failed to find config, please verify the location or syntax");
          break;
        case ConfigErrorCode.NO_CUSTOM_CONFIG:
          logger.error(`Failed to find config on path: ${error.cause as string}`);
          break;
        case ConfigErrorCode.ENV_MISSING:
          logger.error(`Env variable is missing: ${error.cause as string}`);
          break;
        case ConfigErrorCode.TEMPLATE_ERROR:
          logger.error(`Config template error: ${error.message}`);
          break;
        case ConfigErrorCode.FILE_MISSING:
          logger.error(`File is missing: ${error.cause as string}`);
          break;
        case ConfigErrorCode.GIT_MISSING:
          logger.error(`git variable is missing: ${error.cause as string}`);
          break;
        case ConfigErrorCode.INVALID_CONFIG:
          logger.error(error.cause, "Config failed validation");
          break;
        default:
          logger.error(`Configuration error: ${error.message}`);
      }
    }
    else {
      logger.error(error, "Unknown error");
    }
    return process.exit(1);
  }
};
