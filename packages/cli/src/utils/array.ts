export function normalizeToArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function normalizeToSortedArray<T>(value: T | T[]): T[] {
  return [...normalizeToArray(value)].sort();
}
