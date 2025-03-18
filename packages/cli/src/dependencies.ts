import { isPlainObject } from "@es-toolkit/es-toolkit";
import { logger } from "./logger.ts";
import { matchAWSPath } from "./aws/path.ts";
import { matchCloudflarePath } from "./cloudflare/path.ts";
import type { Context } from "./types/context.ts";
import type { Dependencies, ResourceDependency } from "./types/dependencies.ts";
import type { NoopUnit, Plan } from "./types/plan.ts";
import { Type } from "./types/plan.ts";
import { resolveUnitDeps } from "@/utils/template.ts";

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

export function getDependencies(
  _context: Context,
  plan: Plan,
  print = false,
): Promise<Dependencies> {
  if (print) {
    logger.info("[Dependencies] Resolving dependencies");
  }

  const deps: [string, string[]][] = plan.map(({ path, ...rest }) => {
    switch (rest.type) {
      case Type.Delete:
        return [path, rest.state.dependsOn.map(({ resourcePath }) => resourcePath)];
      case Type.CreateVersion:
      case Type.Update:
      case Type.Noop:
      case Type.Create:
        return [path, rest.dependsOn.map(({ resourcePath }) => resourcePath)];
      default:
        return [path, []];
    }
  });

  const _childToParents = deps.reduce((acc, [path, children]) => {
    if (acc[path]) {
      acc[path].push(...children);
    } else {
      acc[path] = children;
    }
    return acc;
  }, {} as Record<string, string[]>);

  const _parentToChildren = deps.reduce((acc, [path, children]) => {
    children.forEach((child) => {
      if (acc[child]) {
        acc[child].push(path);
      } else {
        acc[child] = [path];
      }
    });
    return acc;
  }, {} as Record<string, string[]>);

  return Promise.resolve({});
}

/**
 * Any resources dependencies that are marked as noop will be resolved in planning
 * @example if s3.object dependsOn s3.bucket,
 *  and  s3.bucket is noop
 *  then resolve s3.object execution config
 */
export function resolveNoopDependencies(plan: Plan): Plan {
  const noopUnits = plan.filter((unit) => unit.type === Type.Noop);

  return plan
    .map((unit) => {
      if ("dependsOn" in unit) {
        const { dependsOn } = unit;
        if (dependsOn.length) {
          const noopUnitDeps: NoopUnit[] = [];
          for (const dep of dependsOn) {
            const noopUnit = noopUnits.find((noop) => noop.path === dep.resourcePath);
            if (noopUnit) {
              noopUnitDeps.push(noopUnit);
            }
          }

          if (noopUnitDeps.length) {
            return resolveUnitDeps(unit, noopUnitDeps);
          }
        }
      }
      return unit;
    });
}
