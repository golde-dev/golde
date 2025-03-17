import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../../utils/object.ts";
import type { DatabaseConfig, DatabaseState } from "./types.ts";

export const BASE_PATH = "cloudflare.d1.database";

export function d1DatabasePath(name: string) {
  return prefixPath(BASE_PATH, name);
}

export function removeD1Prefix(path: string) {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllowedKeys<DatabaseState>({
  createdAt: true,
  updatedAt: true,
  uuid: true,
});

const configAttributes = ensureAllowedKeys<DatabaseConfig>({
  locationHint: true,
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const possibleAttributes = [
  ...stateAttributes,
  ...configAttributes,
];
const possibleAttributePattern = possibleAttributes.join("|");

const pattern = new RegExp(`^(?<name>.+)\\.(?<attributePath>${possibleAttributePattern})$`);

export function matchD1Database(path: string): [string, string, string | null] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const groupPath = removeD1Prefix(path);
  const match = pattern.exec(groupPath);

  if (!match) {
    throw new Error(`Incorrect D1 Database path: ${path}`);
  }
  const {
    groups: { name, attributePath = null } = {},
  } = match;

  return [
    d1DatabasePath(name),
    name,
    attributePath,
  ];
}
