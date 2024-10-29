import { isPlainObject } from "moderndash";

export function writeJSON(path: string, data: object | unknown[]): Promise<void> {
  if (!isPlainObject(data) && !Array.isArray(data)) {
    throw new Error("invalid JSON data");
  }
  const string = JSON.stringify(data, null, 2);
  return Deno.writeTextFile(path, string);
}

export async function readJSON<T extends object | unknown[]>(path: string): Promise<T> {
  const text = await Deno.readTextFile(path);
  const parsed = JSON.parse(text);

  if (!isPlainObject(parsed) && !Array.isArray(parsed)) {
    throw new Error("invalid JSON");
  }
  return parsed as T;
}
