import { isPlainObject } from "@es-toolkit/es-toolkit";
import { logger } from "./logger.ts";
import type { Context } from "./types/context.ts";
import type { ConfigDependency, Dependencies } from "./types/dependencies.ts";
import type { Plan } from "./types/plan.ts";
import { matchAWSPath } from "./aws/path.ts";

const templateRe = new RegExp(/\{\{([^{}]*)\}\}/g);
const stateRe = new RegExp(/(?<=state.)(.*)/);

export function dependenciesSearch(
  string: string,
  dependencies: ConfigDependency[],
): ConfigDependency[] {
  const trimmed = string.trim();
  const match = templateRe.exec(trimmed);

  if (match) {
    const [placeholder, key] = match;
    if (placeholder === trimmed) {
      const match = stateRe.exec(key);
      if (match) {
        const [deps] = match;
        const depsMatch = matchAWSPath(deps);
        if (depsMatch) {
          const [path, name, attribute] = depsMatch;
          dependencies.push({
            path,
            name,
            attribute,
          });
          return dependencies;
        }
      }
    } else {
      throw new Error(`Invalid template string: ${string}`);
    }
  }
  return dependencies;
}

export function findConfigDependencies(
  value: unknown,
  dependencies: ConfigDependency[] = [],
): ConfigDependency[] {
  if (typeof value === "string") {
    dependenciesSearch(value, dependencies);
  } else if (value instanceof Array) {
    value.map((val) => findConfigDependencies(val, dependencies));
  } else if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, val]) => {
      dependenciesSearch(key, dependencies);
      findConfigDependencies(val, dependencies);
    });
  }
  return dependencies;
}

export function getDependencies(
  _context: Context,
  _plan: Plan,
  print = false,
): Promise<Dependencies> {
  if (print) {
    logger.info("[Dependencies] Resolving dependencies");
  }
  return Promise.resolve({});
}
