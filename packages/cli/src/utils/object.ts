import { set } from "moderndash";
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
 * Remove properties of empty objects
 */
const omitEmptyObjects = (state: unknown): unknown => {
  if (!isPlainObject(state)) {
    return state;
  }
  return Object.fromEntries(
    Object.entries(state)
      .filter(([_, value]) => !isPlainObject(value) || !isEmpty(value))
      .map(([key, value]) => [key, omitEmptyObjects(value)]),
  );
};

type ChangeSet = {
  path: string;
  state: object;
  type: "Create" | "Update" | "Delete";
}[];

/**
 * Given a object and changeset, apply changes to state and return new state
 */
export function applyChangeSet<T extends object>(state: T = {} as T, changes: ChangeSet): T {
  const newState = structuredClone(state);
  const emptyObject = {};

  for (const unit of changes) {
    const {
      type,
      path,
      state,
    } = unit;

    switch (type) {
      case "Create":
      case "Update":
        set(newState, path, state);
        break;
      case "Delete":
        set(newState, path, emptyObject);
        break;
      default:
        throw new Error("Unknown type");
    }
  }
  return omitEmptyObjects(newState) as T;
}

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
 * Construct array with all properties based on interface
 */
export function ensureAllKeys<T>(obj: { [K in keyof T]: true }): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Add prefix to path, if path contain . wrap it in ['path']
 */
export function prefixPath(prefix: string, path: string): string {
  return path.includes(".") ? `${prefix}['${path}']` : `${prefix}.${path}`;
}

/**
 * Remove prefix from path, handle ['path'] case
 */
export function removePrefix(prefix: string, path: string): string {
  return path.startsWith(`${prefix}.`)
    ? path.replace(`${prefix}.`, "")
    : path.replace(`${prefix}`, "");
}

/**
 * Narrow down to object
 */
export function stringify(value: object): string {
  return JSON.stringify(value);
}
