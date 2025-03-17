import { prefixPath } from "../../../../utils/object.ts";

export const BASE_PATH = "cloudflare.r2.object";

export function r2ObjectPath(name: string) {
  return prefixPath(BASE_PATH, name);
}
export function r2VersionObjectPath(version: string, name: string) {
  return prefixPath(BASE_PATH, `${version}.${name}`);
}
