import { groupBy, isPlainObject, uniq } from "@es-toolkit/es-toolkit";
import { logger } from "./logger.ts";
import { matchAWSPath } from "./aws/path.ts";
import { matchCloudflarePath } from "./cloudflare/path.ts";
import type { Context } from "./types/context.ts";
import type { Dependency, ResourceDependency } from "./types/dependencies.ts";
import type { Plan } from "./types/plan.ts";
import { Type } from "./types/plan.ts";
import { resolveStateDependencies } from "@/utils/template.ts";

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
          const [resourcePath, resourceName, resourceAttribute] = depsMatch;
          dependencies.push({
            statePath,
            resourcePath,
            resourceName,
            resourceAttribute,
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

export function findResourceDependencies(
  value: unknown,
  dependencies: ResourceDependency[] = [],
): ResourceDependency[] {
  if (typeof value === "string") {
    dependenciesSearch(value, dependencies);
  } else if (value instanceof Array) {
    value.map((val) => findResourceDependencies(val, dependencies));
  } else if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, val]) => {
      dependenciesSearch(key, dependencies);
      findResourceDependencies(val, dependencies);
    });
  }
  return dependencies;
}

export function validateDependencies(dependencies: Dependency[]) {
  const grouped = groupBy(dependencies, (d) => d.path);
  for (const [key, value] of Object.entries(grouped)) {
    if (value.length > 1) {
      throw new Error(`Multiple dependencies found for same path: ${key}`);
    }
  }
}

/**
 * Find and fetch external dependencies
 * Assume that dependencies that do not exist in plan are external
 */
export async function getDependencies(
  context: Context,
  plan: Plan,
): Promise<Dependency[]> {
  logger.info("[Dependencies] Resolving dependencies");

  const {
    config: {
      name,
    },
    state,
  } = context;

  const external: string[] = [];
  const plannedUnits: Record<string, Type> = {};
  for (const unit of plan) {
    plannedUnits[unit.path] = unit.type;
  }

  for (const unit of plan) {
    if (unit.type === Type.Delete || unit.type === Type.DeleteVersion) {
      for (const { resourcePath } of unit.state.dependsOn) {
        if (!plannedUnits[resourcePath]) {
          external.push(resourcePath);
        }
      }
    } else {
      for (const { resourcePath } of unit.dependsOn) {
        if (!plannedUnits[resourcePath]) {
          external.push(resourcePath);
        }
      }
    }
  }
  const uniqueExternal = uniq(external);
  if (!uniqueExternal.length) {
    return [];
  }

  const dependencies = await state.getResources(name, uniqueExternal);
  validateDependencies(dependencies);
  return dependencies;
}

/**
 * Any resources dependencies that are noop these can resolved before execution
 * @example if s3.object dependsOn s3.bucket,
 *  and  s3.bucket is noop
 *  then resolve s3.object execution config
 */
export function resolveNoopDependencies(plan: Plan): Plan {
  const units = plan.filter((unit) => unit.type === Type.Noop);
  return plan.map((unit) => resolveStateDependencies(unit, units));
}

/**
 * Resolve external cross branch dependencies
 * @example if s3.object dependsOn s3.bucket,
 *  and  s3.bucket is in another branch
 *  then resolve s3.object execution config with s3.bucket state
 */
export function resolveExternal(plan: Plan, deps: Dependency[]): Plan {
  return plan.map((unit) => resolveStateDependencies(unit, deps));
}
