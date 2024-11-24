import { prefixPath } from "../../../utils/object.ts";

export const BASE_PATH = "aws.s3Object";

export function s3ObjectPath(name: string) {
  return prefixPath(BASE_PATH, name);
}
