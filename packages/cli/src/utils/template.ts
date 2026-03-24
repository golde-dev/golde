import { ConfigError, ConfigErrorCode } from "../error.ts";
import type { GitInfo } from "./git.ts";
import type { ManagedConfig } from "../config.ts";
import type { Unit } from "@/types/plan.ts";
import { get, isArray, isPlainObject, isString } from "es-toolkit/compat";
import type { Config } from "@/types/config.ts";
import type { Resource, SavedResource } from "@/types/dependencies.ts";
import { matchStatePath } from "@/dependencies.ts";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

function originalTemplateString(string: string) {
  return `{{ ${string} }}`;
}

export const isTemplate = (string: string) => {
  return string.includes("{{") && string.includes("}}");
};

export const hasResolved = (value: unknown): boolean => {
  if (isString(value)) {
    return !isTemplate(value);
  }
  if (isArray(value)) {
    return value.every(hasResolved);
  }
  if (isPlainObject(value)) {
    return Object
      .entries(value as object)
      .every(([key, value]) => hasResolved(key) && hasResolved(value));
  }

  return true;
};

export function resolveNestedTemplateString(
  string: string,
  onTemplateFn: (value: string) => string | number | boolean,
): string | number | boolean {
  const nestedTemplateRe = /\{\{([^{}]*)\}\}/g;

  let result = string;
  let current;
  while ((current = nestedTemplateRe.exec(result))) {
    const [
      placeholder,
      key,
    ] = current;

    const replaced = `${onTemplateFn(key.trim())}`;
    const original = `${originalTemplateString(key.trim())}`;

    if (replaced !== original) {
      result = result.replace(placeholder, replaced);
      nestedTemplateRe.lastIndex = 0;
    }
  }
  return result;
}

export function resolveTemplateString(
  string: string,
  onTemplateFn: (value: string) => string | number | boolean,
): string | number | boolean {
  const templateRe = /\{\{([^{}]*)\}\}/g;

  const trimmed = string.trim();
  const match = templateRe.exec(trimmed);

  if (match) {
    const [placeholder, key] = match;
    if (placeholder === trimmed) {
      return onTemplateFn(key.trim());
    } else {
      return resolveNestedTemplateString(trimmed, onTemplateFn);
    }
  }
  return string;
}

export function resolveTemplate(
  value: unknown,
  onTemplate: (value: string) => string | number | boolean,
): unknown {
  if (
    value === undefined ||
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "bigint"
  ) {
    return value;
  } else if (typeof value === "string") {
    return resolveTemplateString(value, onTemplate);
  } else if (typeof value === "symbol") {
    throw new ConfigError(
      "Symbols are not permitted",
      ConfigErrorCode.TEMPLATE_ERROR,
    );
  } else if (typeof value === "function") {
    throw new ConfigError(
      "Functions are not permitted",
      ConfigErrorCode.TEMPLATE_ERROR,
    );
  } else if (value instanceof Set) {
    throw new ConfigError(
      "Set is not permitted",
      ConfigErrorCode.TEMPLATE_ERROR,
    );
  } else if (value instanceof Map) {
    throw new ConfigError(
      "Map is not permitted",
      ConfigErrorCode.TEMPLATE_ERROR,
    );
  } else if (value instanceof Array) {
    return value.map((val) => resolveTemplate(val, onTemplate));
  } else if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record).reduce((current: object, key: string) => {
      return {
        ...current,
        [resolveTemplate(key, onTemplate) as string]: resolveTemplate(
          record[key],
          onTemplate,
        ),
      };
    }, {});
  } else {
    return value;
  }
}

const envRe = new RegExp(/(?<=env.)(.*)/);

export function envTemplate(value: string): string {
  const match = envRe.exec(value);
  if (!match) {
    return originalTemplateString(value);
  }
  const [variableName] = match;

  const envValue = process.env[variableName];
  if (envValue) {
    return envValue;
  } else {
    throw new ConfigError(
      "Env variable is missing",
      ConfigErrorCode.ENV_MISSING,
      variableName,
    );
  }
}

const gitRe = new RegExp(/(?<=git.)(.*)/);

export function gitTemplate(gitInfo: GitInfo) {
  return (value: string): string => {
    const match = gitRe.exec(value.trim());
    if (!match) {
      return originalTemplateString(value);
    }
    const [variableName] = match;

    if (variableName === "BRANCH_SLUG") {
      return gitInfo.branchSlug;
    } else if (variableName === "BRANCH_NAME") {
      return gitInfo.branchName;
    } else {
      throw new ConfigError(
        "git variable is missing",
        ConfigErrorCode.GIT_MISSING,
        variableName,
      );
    }
  };
}

const configRe = new RegExp(/(?<=config.)(.*)/);

export const configTemplate =
  (config: ManagedConfig) => (value: string): string | number | boolean => {
    const match = configRe.exec(value);
    if (!match) {
      return originalTemplateString(value);
    }
    const [variableName] = match;
    if (variableName in config) {
      return config[variableName];
    } else {
      throw new ConfigError(
        "Managed config value is missing",
        ConfigErrorCode.MANAGED_CONFIG_NOT_FOUND,
        variableName,
      );
    }
  };

const fileRe = new RegExp(/(?<=file\()(.*)(?=\))/);

export const fileTemplate = (value: string): string => {
  const match = fileRe.exec(value);
  if (!match) {
    return originalTemplateString(value);
  }
  const [fileName] = match;

  if (existsSync(fileName)) {
    return readFileSync(fileName, { encoding: "utf-8" });
  } else {
    throw new ConfigError(
      "Template file is missing",
      ConfigErrorCode.FILE_MISSING,
      fileName,
    );
  }
};

const resourcesRe = new RegExp(/(?<=resources.)(.*)/);

export const resourcesTemplate =
  (resources: Omit<SavedResource, "createdAt" | "updatedAt">[]) => (value: string): string => {
    const match = resourcesRe.exec(value.trim());
    if (!match) {
      return originalTemplateString(value);
    }
    const [resourceMatch] = match;
 
    const deps = matchStatePath(resourceMatch);

    if (deps) {
      const [resourcePath, _, resourceAttribute] = deps;
      const selectedResources = resources.filter(({ path }) => path === resourcePath);
      if (selectedResources.length === 0) {
        return originalTemplateString(value);
      }

      const [firstResource] = selectedResources;
      if (selectedResources.length === 1 && firstResource) {
        const [firstResource] = selectedResources;
        const value = get(firstResource.state, resourceAttribute);
        if (typeof value === "string") {
          return value;
        }
      }
      const currentResource = selectedResources.find(({ isCurrent }) => isCurrent);
      if (selectedResources.length > 0 && currentResource) {
        const value = get(currentResource.state, resourceAttribute);
        if (typeof value === "string") {
          return value;
        }
      }

      throw new ConfigError(
        `Failed to resolve state dependency on ${resourceMatch}`,
        ConfigErrorCode.INVALID_CONFIG,
      );
    }
    return originalTemplateString(value);
  };
/**
 * Resolve unit dependencies
 * Only resolve args and config
 */
export const resolveUnitState = <T extends Unit>(
  unit: T,
  resources: Omit<Resource, "createdAt" | "updatedAt">[],
): T => {
  if (!resources.length) {
    return unit;
  }
  const resolved = {
    ...unit,
  };
  const onTemplate = resourcesTemplate(resources);

  if ("args" in resolved) {
    resolved.args = resolveTemplate(resolved.args, onTemplate) as typeof resolved.args;
  }
  if ("config" in resolved) {
    resolved.config = resolveTemplate(resolved.config, onTemplate) as typeof resolved.config;
  }

  return resolved;
};

export const resolveConfigState = (
  config: Config,
  resources: SavedResource[] = [],
): Config => {
  if (!resources.length) {
    return config;
  }
  const onTemplate = resourcesTemplate(resources);
  return resolveTemplate(config, onTemplate) as Config;
};
