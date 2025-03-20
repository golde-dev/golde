import { isPlainObject, isString } from "@es-toolkit/es-toolkit";
import { isTemplate } from "./template.ts";
import { isArray, isNumber } from "@es-toolkit/es-toolkit/compat";

/**
 * Deeply compare two configs.
 * If config contains template, it will return false
 */
export function isConfigEqual(
  previousConfig: unknown,
  nextConfig: unknown,
): boolean {
  if (isArray(previousConfig) && isArray(nextConfig)) {
    if (previousConfig.length !== nextConfig.length) {
      return false;
    }
    return previousConfig.every((item, index) => isConfigEqual(item, nextConfig[index]));
  }

  if (isString(previousConfig) && isString(nextConfig)) {
    if (isTemplate(nextConfig)) {
      return false;
    }
    if (isTemplate(previousConfig)) {
      return false;
    }
    return previousConfig === nextConfig;
  }

  if (isNumber(previousConfig) && isNumber(nextConfig)) {
    return previousConfig === nextConfig;
  }

  if (isPlainObject(previousConfig) && isPlainObject(nextConfig)) {
    return Object.entries(previousConfig).every(([key, prev]) => {
      return isConfigEqual(prev, nextConfig[key]);
    });
  }

  return previousConfig === nextConfig;
}
