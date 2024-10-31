import { isEmpty, set } from "moderndash";
import { isPlainObject } from "@es-toolkit/es-toolkit";

/**
 * Remove properties of empty objects
 */
export const removeEmpty = (state: unknown): unknown => {
  if (!isPlainObject(state)) {
    return state;
  }
  return Object.fromEntries(
    Object.entries(state)
      .filter(([_, value]) => !isPlainObject(value) || !isEmpty(value))
      .map(([key, value]) => [key, removeEmpty(value)]),
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
  return removeEmpty(newState) as T;
}
