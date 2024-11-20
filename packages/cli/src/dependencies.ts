import { isPlainObject } from "@es-toolkit/es-toolkit";
import { logger } from "./logger.ts";
import { matchAWSPath } from "./aws/path.ts";
import { matchCloudflarePath } from "./cloudflare/path.ts";
import type { Context } from "./types/context.ts";
import type { Dependencies, ResourceDependency } from "./types/dependencies.ts";
import type { Plan } from "./types/plan.ts";

const templateRe = new RegExp(/\{\{([^{}]*)\}\}/g);
const stateRe = new RegExp(/(?<=state.)(.*)/);

export function dependenciesSearch(
  string: string,
  dependencies: ResourceDependency[],
): ResourceDependency[] {
  const trimmed = string.trim();
  const match = templateRe.exec(trimmed);

  if (match) {
    const [placeholder, key] = match;
    if (placeholder === trimmed) {
      const match = stateRe.exec(key);
      if (match) {
        const [statePath] = match;
        const depsMatch = matchAWSPath(statePath) ?? matchCloudflarePath(statePath);
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
  dependencies: ResourceDependency[] = [],
): ResourceDependency[] {
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
  plan: Plan,
  print = false,
): Promise<Dependencies> {
  if (print) {
    logger.info("[Dependencies] Resolving dependencies");
  }
  plan.forEach((unit) => {
    const {
      path,
    } = unit;
    logger.debug(`[Dependencies] Resolving dependencies for ${path}`);
  });

  return Promise.resolve({});
}
