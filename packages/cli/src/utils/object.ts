import { isEmpty, set } from "moderndash";
import { isPlainObject } from "@es-toolkit/es-toolkit";

/**
 * Remove properties of empty objects
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

export function prefixPath(prefix: string, path: string): string {
  return path.includes(".") ? `${prefix}['${path}']` : `${prefix}.${path}`;
}

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
