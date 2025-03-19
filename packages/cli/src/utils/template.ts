import { ConfigError, ConfigErrorCode } from "../error.ts";
import type { GitInfo } from "./git.ts";
import { existsSync } from "@std/fs/exists";
import type { ManagedConfig } from "../config.ts";
import type { Unit } from "@/types/plan.ts";
import { get } from "@es-toolkit/es-toolkit/compat";
import type { ResourceState } from "@/types/config.ts";
import type { Dependency } from "@/types/dependencies.ts";
import type { State } from "@/mod.ts";

function originalTemplateString(string: string) {
  return `{{ ${string} }}`;
}

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

  const env = Deno.env.get(variableName);
  if (env) {
    return env;
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
    const match = gitRe.exec(value);
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
    return Deno.readTextFileSync(fileName);
  } else {
    throw new ConfigError(
      "Template file is missing",
      ConfigErrorCode.FILE_MISSING,
      fileName,
    );
  }
};

const stateRe = new RegExp(/(?<=state.)(.*)/);

export const stateTemplate = (_state: State) => (value: string): string => {
  return originalTemplateString(value);
};

export const unitStateTemplate =
  (unit: Unit, resources: { path: string; state: ResourceState }[]) => (value: string): string => {
    const match = stateRe.exec(value);
    if (!match) {
      return originalTemplateString(value);
    }
    const [stateMatch] = match;
    if ("dependsOn" in unit) {
      const dependsOn = unit.dependsOn.find(({ statePath }) => statePath === stateMatch);
      if (dependsOn) {
        const {
          resourcePath,
          resourceAttribute,
        } = dependsOn;

        const stateUnit = resources.find((d) => d.path === resourcePath);
        if (stateUnit) {
          const { state } = stateUnit;

          if (
            ("current" in state && typeof state.current === "string") &&
            ("versions" in state && typeof state.versions === "object")
          ) {
            const currentVersion = get(state.versions, state.current);
            const value = get(currentVersion, resourceAttribute);

            if (typeof value === "string") {
              return value;
            }
          } else {
            const value = get(state, resourceAttribute);
            if (typeof value === "string") {
              return value;
            }
          }
          throw new ConfigError(
            `Failed to resolve unit ${unit.path} dependency on ${stateUnit.path}, attribute ${resourceAttribute} is missing`,
            ConfigErrorCode.STATE_MISSING,
          );
        }
      }
    }
    return originalTemplateString(value);
  };

/**
 * Resolve unit dependencies
 * Only resolve args and config
 */
export const resolveStateDependencies = <T extends Unit>(
  unit: T,
  resources: Dependency[],
): T => {
  const resolved = {
    ...unit,
  };
  const onTemplate = unitStateTemplate(unit, resources);

  if ("args" in resolved) {
    resolved.args = resolveTemplate(resolved.args, onTemplate) as typeof resolved.args;
  }
  if ("config" in resolved) {
    resolved.config = resolveTemplate(resolved.config, onTemplate) as typeof resolved.config;
  }

  if ("dependsOn" in resolved) {
    resolved.dependsOn = resolved.dependsOn.map((dependOn) => {
      if (resources.find((resource) => resource.path === dependOn.resourcePath)) {
        return {
          ...dependOn,
          resolved: true,
        };
      }
      return dependOn;
    });
  }

  return resolved;
};
