import { isPlainObject } from "es-toolkit";
import { readFileSync, writeFileSync } from "node:fs";

export function writeJSON(path: string, data: object | unknown[]): void {
  if (!isPlainObject(data) && !Array.isArray(data)) {
    throw new Error("invalid JSON data");
  }
  const string = JSON.stringify(data, null, 2);
  return writeFileSync(path, string, { encoding: "utf-8" });
}

export function readJSON<T extends object | unknown[]>(path: string): T {
  const text = readFileSync(path, { encoding: "utf-8" });
  const parsed = JSON.parse(text);

  if (!isPlainObject(parsed) && !Array.isArray(parsed)) {
    throw new Error("invalid JSON");
  }
  return parsed as T;
}
