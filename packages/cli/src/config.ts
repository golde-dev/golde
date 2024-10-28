import { validateConfig } from "./schema.ts";
import { logger } from "./logger.ts";
import { existsSync } from "@std/fs";
import { parse as parseToml } from "@std/toml";
import { parse as parseYaml } from "@std/yaml";
import { resolve } from "node:path";
import { ConfigError, ConfigErrorCode } from "./error.ts";
import { dynamicImport } from "./utils/import.ts";
import { getBranchName, getGitInfo, type GitInfo } from "./clients/git.ts";
import { isEmpty, isPlainObject } from "moderndash";
import { extname, globToRegExp } from "@std/path";
import { decode } from "./utils/text.ts";
import {
  envTemplate,
  fileTemplate,
  gitTemplate,
  resolveTemplate,
  stateTemplate,
} from "./utils/template.ts";
import type { Dependencies } from "./types/dependencies.ts";
import type { Config } from "./types/config.ts";

const loadConfig = async (
  path: string,
): Promise<unknown> => {
  logger.debug(`Loading config from: ${path}`);

  switch (extname(path)) {
    case ".cjs":
    case ".json":
    case ".js":
    case ".ts": {
      const { default: config } = await dynamicImport(path);
      return config;
    }
    case ".toml": {
      const tomlConfig = decode(
        Deno.readFileSync(path),
      );
      return parseToml(tomlConfig);
    }
    case ".yml":
    case ".yaml": {
      const yamlConfig = decode(
        Deno.readFileSync(path),
      );
      return parseYaml(yamlConfig);
    }
    default:
      throw new Error("Unknown extension");
  }
};

export const getConfigRaw = (
  path?: string,
): Promise<unknown> => {
  logger.debug(`Loading config`);
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

const testBranchPattern = (branch: unknown, pattern: unknown) => {
  if (typeof branch !== "string") {
    throw new Error("Branch is not a string");
  }
  if (typeof pattern !== "string") {
    throw new Error("Pattern is not a string");
  }
  return globToRegExp(pattern).test(branch);
};

const testBranchName = (branch: unknown, filterBranch: string) => {
  if (typeof branch !== "string") {
    throw new Error("Branch is not a string");
  }
  return branch === filterBranch;
};

/**
 * Recursively filter config to only include resources for the given branch
 */
export const filterToBranch = (config: unknown, filterBranch: string): unknown => {
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
          return testBranchName(branch, filterBranch) || testBranchPattern(branch, branchPattern);
        } else if (branch) {
          return testBranchName(branch, filterBranch);
        }
        return true;
      })
      .map(([key, value]) => [key, filterToBranch(value, filterBranch)])
      .filter(([_, value]) => !isPlainObject(value) || !isEmpty(value)),
  );
};

export const resolveConfig = (config: unknown, gitInfo: GitInfo, branch?: string): Config => {
  try {
    logger.debug("Resolving config");

    const configWithEnv = resolveTemplate(config, envTemplate);
    logger.debug("Resolved env vars templates in config", {
      config: configWithEnv,
    });

    const configWithFiles = resolveTemplate(configWithEnv, fileTemplate);
    logger.debug("Resolved files templates in config", {
      config: configWithFiles,
    });

    const configWithGit = resolveTemplate(configWithFiles, gitTemplate(gitInfo));
    logger.debug("Resolved git templates in config", { config: configWithGit });

    validateConfig(configWithGit);
    logger.debug("Validated config with schema");

    if (!branch) {
      return configWithGit;
    }
    return filterToBranch(configWithGit, branch) as Config;
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

export async function getConfig(configPath?: string, all: boolean = false): Promise<Config> {
  const rawConfig = await getConfigRaw(configPath);

  const branch = getBranchName();
  const gitInfo = getGitInfo();

  return all ? resolveConfig(rawConfig, gitInfo) : resolveConfig(rawConfig, gitInfo, branch);
}

export function getFinalConfig(config: Config, dependencies: Dependencies): Config {
  try {
    const configWithDeps = resolveTemplate(config, stateTemplate(dependencies));
    logger.debug("Resolved state dependencies in config", { config: configWithDeps });
    validateConfig(configWithDeps);
    return config;
  } catch (error) {
    if (error instanceof ConfigError) {
      switch (error.code) {
        case ConfigErrorCode.STATE_MISSING:
          logger.error(`State variable is missing: ${error.cause as string}`);
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
}
