import { existsSync } from "node:fs";
import type { Config } from "./types/config.ts";
import { validateConfig } from "./schema.ts";
import { logger } from "./logger.ts";
import { extname, resolve } from "node:path";
import { ConfigError, ConfigErrorCode } from "./error.ts";
import {
  envTemplate,
  fileTemplate,
  gitTemplate,
  resolveTemplate,
} from "./utils/template.ts";
import { dynamicImport } from "./utils/import.ts";

const loadConfig = async (
  path: string,
): Promise<{ config: unknown; path: string }> => {
  logger.debug(path, "Loading config");

  switch (extname(path)) {
    case ".cjs":
    case ".json":
    case ".js":
    case ".ts": {
      const { default: config } = await dynamicImport(path);
      return { config, path };
    }
    case ".toml": {
      const decoder = new TextDecoder("utf-8");
      const tomlConfig = decoder.decode(
        Deno.readFileSync(path),
      );
      return { config: tomlConfig, path };
    }
    default:
      throw new Error("Unknown extension");
  }
};

const getConfigRaw = (
  path?: string,
): Promise<{ config: unknown; path: string }> => {
  if (path) {
    if (existsSync(resolve(path))) {
      return loadConfig(path);
    } else {
      throw new ConfigError(
        `Failed to find custom config at path: ${path}`,
        ConfigErrorCode.NO_CUSTOM_CONFIG,
        path,
      );
    }
  }
  const possiblePaths = [
    resolve("./golde.config.cjs"),
    resolve("./golde.config.json"),
    resolve("./golde.config.js"),
    resolve("./golde.config.ts"),
    resolve("./golde.toml"),
  ];

  for (const configPath of possiblePaths) {
    logger.debug(`Checking config path: ${configPath}`);
    if (existsSync(configPath)) {
      return loadConfig(configPath);
    }
  }
  throw new ConfigError(
    "Failed to find config, please verify the location or syntax",
    ConfigErrorCode.NO_CONFIG,
  );
};

export const getConfig = async (configPath?: string): Promise<Config> => {
  try {
    logger.debug("Loading config");
    const { config, path } = await getConfigRaw(configPath);
    logger.debug("Loaded config", { config, path });

    const configWithEnv = resolveTemplate(config, envTemplate);
    logger.debug("Resolved env vars templates in config", {
      config: configWithEnv,
    });

    const configWithFiles = resolveTemplate(configWithEnv, fileTemplate);
    logger.debug("Resolved files templates in config", {
      config: configWithFiles,
    });

    const configWithGit = resolveTemplate(configWithFiles, gitTemplate);
    logger.debug("Resolved git templates in config", { config: configWithGit });

    validateConfig(configWithGit);
    logger.debug("Validated config with json schema");

    return configWithGit;
  } catch (error) {
    if (error instanceof ConfigError) {
      switch (error.code) {
        case ConfigErrorCode.NO_CONFIG:
          logger.error(
            "Failed to find config, please verify the location or syntax",
          );
          break;
        case ConfigErrorCode.NO_CUSTOM_CONFIG:
          logger.error(
            `Failed to find config on path: ${error.cause as string}`,
          );
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
          logger.error("Config failed validation", error.cause);
          break;
        default:
          logger.error(`Configuration error: ${error.message}`);
      }
    } else {
      logger.error(`Unknown error: ${(error as Error).message}`, error);
    }
    return Deno.exit(1);
  }
};
