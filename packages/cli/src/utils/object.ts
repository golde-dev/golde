import { isPlainObject } from "@es-toolkit/es-toolkit";

/**
 * Check if object is empty
 */
export function isEmptyObject(value: object): boolean {
  return Object.keys(value).length === 0;
}

/**
 * Check if value is empty
 * Internally use instanceof operator, cross frame objects will not get properly detected as empty
 * @example
 * isEmpty(null) //true
 * isEmpty(undefined) //true
 * isEmpty("") //true
 * isEmpty({}) //true
 * isEmpty([]) //true
 * isEmpty(new Set()) //true
 * isEmpty(new Map()) //true
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string") {
    return value.length === 0;
  }
  if (value instanceof Set) {
    return value.size === 0;
  }
  if (value instanceof Map) {
    return value.size === 0;
  }
  if (value instanceof Array) {
    return value.length === 0;
  }
  if (isPlainObject(value)) {
    return isEmptyObject(value);
  }
  return false;
}

/**
 * Remove object properties that contain empty objects
 */
export const omitEmptyObjects = (state: unknown): unknown => {
  if (!isPlainObject(state)) {
    return state;
  }
  return Object.fromEntries(
    Object.entries(state)
      .filter(([_, value]) => !isPlainObject(value) || !isEmpty(value))
      .map(([key, value]) => [key, omitEmptyObjects(value)]),
  );
};

/**
 * Recursively remove undefined properties
 */
export function omitUndefined<T extends object>(object: T): T {
  if (!isPlainObject(object)) {
    return object;
  }
  return Object.fromEntries(
    Object.entries(object)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, omitUndefined(value)]),
  ) as T;
}

/**
 * Utility type to filter keys by allowed types (string | number | boolean)
 */
type AllowedKeyOf<T> = {
  [K in keyof T]: T[K] extends string | number | undefined | boolean ? K : never;
}[keyof T];

/**
 * Construct array with only keys that have string | number | boolean values
 */
export function ensureAllowedKeys<T>(obj: { [K in AllowedKeyOf<T>]: true }): AllowedKeyOf<T>[] {
  return Object.keys(obj) as AllowedKeyOf<T>[];
}

/**
 * Add prefix to string
 */
export function prefixPath(prefix: string, path: string): string {
  return `${prefix}.${path}`;
}

/**
 * Remove prefix from path
 */
export function removePrefix(prefix: string, path: string): string {
  return path.replace(`${prefix}.`, "");
}

/**
 * Narrow down to object
 */
export function stringify(value: object): string {
  return JSON.stringify(value, null, 2);
}
