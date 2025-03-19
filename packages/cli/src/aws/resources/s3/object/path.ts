import { prefixPath } from "../../../../utils/object.ts";

export const BASE_PATH = "aws.s3.object";

export function s3ObjectPath(name: string) {
  return prefixPath(BASE_PATH, name);
}
export function s3VersionObjectPath(version: string, name: string) {
  return prefixPath(BASE_PATH, `${version}.${name}`);
}
