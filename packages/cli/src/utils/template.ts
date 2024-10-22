import { existsSync, readFileSync } from "node:fs";
import { ConfigError, ConfigErrorCode } from "../error.ts";
import type { GitInfo } from "../clients/git.ts";
import type { Dependencies } from "../types/dependencies.ts";

const templateRe = new RegExp(/{{(.*?)}}/g);

export const resolveTemplate = (
  value: unknown,
  onTemplate: (value: string) => string,
): unknown => {
  if (
    value === undefined ||
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "bigint"
  ) {
    return value;
  } else if (typeof value === "string") {
    return value.replaceAll(templateRe, (match) => {
      return onTemplate(match.replace("{{", "").replace("}}", "").trim());
    });
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
};

const envRe = new RegExp(/(?<=env.)(.*)/);

export const envTemplate = (value: string): string => {
  const match = envRe.exec(value);
  if (match) {
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
  return `{{ ${value} }}`;
};

const gitRe = new RegExp(/(?<=git.)(.*)/);

export const gitTemplate = (gitInfo: GitInfo) => (value: string): string => {
  const match = gitRe.exec(value);
  if (match) {
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
  }
  return `{{ ${value} }}`;
};

const fileRe = new RegExp(/(?<=file\()(.*)(?=\))/);

export const fileTemplate = (value: string): string => {
  const match = fileRe.exec(value);
  if (match) {
    const [fileName] = match;

    if (existsSync(fileName)) {
      return readFileSync(fileName, { encoding: "utf8" });
    } else {
      throw new ConfigError(
        "Template file is missing",
        ConfigErrorCode.FILE_MISSING,
        fileName,
      );
    }
  }
  return `{{ ${value} }}`;
};

const _stateRe = new RegExp(/(?<=state.)(.*)/);

export const stateTemplate = (_dependencies: Dependencies) => (value: string): string => {
  return `{{ ${value} }}`;
};
