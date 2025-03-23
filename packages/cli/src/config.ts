import { validateConfig } from "./schema.ts";
import { logger } from "./logger.ts";
import { formatDuration } from "./utils/duration.ts";
import { isEmpty } from "./utils/object.ts";
import { parse as parseToml } from "@std/toml";
import { parse as parseYaml } from "@std/yaml";
import { ConfigError, ConfigErrorCode } from "./error.ts";
import { dynamicImport } from "./utils/import.ts";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { getBranchName, getGitInfo, type GitInfo } from "./utils/git.ts";
import { isPlainObject } from "@es-toolkit/es-toolkit";
import { basename, extname, resolve } from "node:path";
import {
  configTemplate,
  envTemplate,
  fileTemplate,
  gitTemplate,
  resolveTemplate,
} from "./utils/template.ts";
import type { Config } from "./types/config.ts";

const loadConfig = async (
  path: string,
): Promise<unknown> => {
  logger.info(`[Config] Loading config from: ${basename(path)}`);

  switch (extname(path)) {
    case ".cjs":
    case ".json":
    case ".js":
    case ".ts": {
      const { default: config } = await dynamicImport(path);
      return config;
    }
    case ".toml": {
      const tomlConfig = await readFile(path, { encoding: "utf-8" });
      return parseToml(tomlConfig);
    }
    case ".yml":
    case ".yaml": {
      const yamlConfig = await readFile(path, { encoding: "utf-8" });
      return parseYaml(yamlConfig);
    }
    default:
      throw new Error(`Unsupported extension ${extname(path)}`);
  }
};

export const getConfigRaw = (
  path?: string,
): Promise<unknown> => {
  logger.debug(`[Config] Searching for config file`);
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
    resolve("./golde.yaml"),
    resolve("./golde.yml"),
  ];

  for (const configPath of possiblePaths) {
    logger.debug(`[Config] Checking config path: ${configPath}`);
    if (existsSync(configPath)) {
      return loadConfig(configPath);
    }
  }
  throw new ConfigError(
    "Failed to find config, please verify the location or syntax",
    ConfigErrorCode.NO_CONFIG,
  );
};

const testBranchPattern = (pattern: unknown, branch: unknown) => {
  if (typeof branch !== "string") {
    throw new Error("Branch is not a string");
  }
  if (typeof pattern !== "string") {
    throw new Error("Pattern is not a string");
  }
  return new RegExp(pattern).test(branch);
};

const testBranchName = (branch: unknown, filter: string) => {
  if (typeof branch !== "string") {
    throw new Error("Branch is not a string");
  }
  return branch === filter;
};

/**
 * Recursively filter config to only include resources for the given branch
 */
export const filterToBranch = (config: unknown, filter: string): unknown => {
  if (!isPlainObject(config)) {
    return config;
  }
  return Object.fromEntries(
    Object.entries(config)
      .filter(([, value]) => {
        if (!isPlainObject(value)) {
          return true;
        }
        const {
          branch,
          branchPattern,
        } = value;

        if (branch && branchPattern) {
          return testBranchName(branch, filter) && testBranchPattern(branchPattern, filter);
        } else if (branch) {
          return testBranchName(branch, filter);
        }
        return true;
      })
      .map(([key, value]) => [key, filterToBranch(value, filter)])
      .filter(([_, value]) => !isPlainObject(value) || !isEmpty(value)),
  );
};

export interface ManagedConfig {
  [key: string]: string | number | boolean;
}

export async function getManagedConfig(_config: Config): Promise<ManagedConfig> {
  return await Promise.resolve({});
}

export const resolveManagedConfig = (config: Config, managedConfig: ManagedConfig): Config => {
  const configWithConfig = resolveTemplate(config, configTemplate(managedConfig));
  logger.debug("[Config] Resolved managed config templates in config", {
    config: configWithConfig,
  });
  const validatedConfig = validateConfig(configWithConfig);
  logger.debug("[Config] Validated config with schema", { config: validatedConfig });

  return validatedConfig;
};

export const resolveConfig = (
  config: unknown,
  gitInfo: GitInfo,
  branch?: string,
): Config => {
  logger.debug("[Config] Resolving config");

  const configWithEnv = resolveTemplate(config, envTemplate);
  logger.debug("[Config] Resolved env vars templates in config", { config: configWithEnv });

  const configWithFiles = resolveTemplate(configWithEnv, fileTemplate);
  logger.debug("[Config] Resolved file templates in config", { config: configWithFiles });

  const configWithGit = resolveTemplate(configWithFiles, gitTemplate(gitInfo));
  logger.debug("[Config] Resolved git templates in config", { config: configWithGit });

  const validatedConfig = validateConfig(configWithGit);
  logger.debug("[Config] Validated config with schema", { config: validatedConfig });

  if (!branch) {
    return validatedConfig;
  }
  return filterToBranch(validatedConfig, branch) as Config;
};

export async function getConfig(branch: string, configPath?: string): Promise<Config> {
  logger.debug("[Config] Start config initialization");
  const start = performance.now();

  try {
    const branchName = getBranchName(branch);
    const rawConfig = await getConfigRaw(configPath);
    const gitInfo = getGitInfo(branch);

    const resolvedBase = resolveConfig(rawConfig, gitInfo, branchName);
    const managedConfig = await getManagedConfig(resolvedBase);
    const resolvedManaged = resolveManagedConfig(resolvedBase, managedConfig);

    const end = performance.now();
    logger.info(`[Config] Initialized config in ${formatDuration(end - start)}`);
    return resolvedManaged;
  } catch (error) {
    if (error instanceof ConfigError) {
      switch (error.code) {
        case ConfigErrorCode.NO_CONFIG:
          logger.error(
            "[Config] Failed to find config, please verify the location or syntax",
          );
          break;
        case ConfigErrorCode.NO_CUSTOM_CONFIG:
          logger.error(
            `[Config] Failed to find config on path: ${error.cause as string}`,
          );
          break;
        case ConfigErrorCode.ENV_MISSING:
          logger.error(`[Config] Env variable is missing: ${error.cause as string}`);
          break;
        case ConfigErrorCode.TEMPLATE_ERROR:
          logger.error(`[Config] Config template error: ${error.message}`);
          break;
        case ConfigErrorCode.FILE_MISSING:
          logger.error(`[Config] File is missing: ${error.cause as string}`);
          break;
        case ConfigErrorCode.GIT_MISSING:
          logger.error(`[Config] git variable is missing: ${error.cause as string}`);
          break;
        case ConfigErrorCode.INVALID_CONFIG:
          logger.error("[Config] Config failed validation", error.cause);
          break;
        case ConfigErrorCode.MANAGED_CONFIG_NOT_FOUND:
          logger.warn("[Config] No managed config value found", { error });
          break;
        default:
          logger.error(`[Config] Configuration error: ${error.message}`);
      }
    } else if (error instanceof Error) {
      logger.error(`[Config] Unknown error: ${error.message}`, error);
    }
    return Deno.exit(1);
  }
}
