// deno-lint-ignore-file no-explicit-any
import { isPlainObject, isPrimitive } from "es-toolkit";
import { isArray } from "es-toolkit/compat";

const cache = new Map<string, Promise<unknown>>();

/**
 * Compute a unique key for the given arguments.
 * Primitives are returned as-is, objects are stringified, and arrays are joined.
 * Class instances are converted to strings.
 */
const getKey = (args: unknown[]): string => {
  return args.map((arg) => {
    if (isPrimitive(arg)) {
      return arg;
    }
    if (isPlainObject(arg)) {
      return JSON.stringify(arg);
    }
    if (isArray(arg)) {
      return arg.map(getKey).join();
    }
    return `${arg}`;
  }).join("-");
};

/**
 * Create a memoized version of the provided async function.
 * Rejection clears the cache.
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<Awaited<ReturnType<T>>>>(
  fn: T,
): T {
  const memoized = ((...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = getKey(args);
    const promise = cache.get(key);

    if (promise) {
      return promise as Promise<Awaited<ReturnType<T>>>;
    }
    const newPromise = fn(...args).catch((error) => {
      cache.delete(key);
      throw error;
    });

    cache.set(key, newPromise);
    return newPromise;
  }) as T;

  return memoized;
}
