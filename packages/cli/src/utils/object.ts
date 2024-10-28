import { isEmpty, isPlainObject } from "moderndash";

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
