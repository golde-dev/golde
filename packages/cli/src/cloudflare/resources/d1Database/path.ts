import { ensureAllKeys, prefixPath, removePrefix } from "../../../utils/object.ts";
import type { DatabaseConfig, DatabaseState } from "./types.ts";

export const BASE_PATH = "cloudflare.d1Database";

export function d1DatabasePath(name: string) {
  return prefixPath(BASE_PATH, name);
}

export function removeD1Prefix(path: string) {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllKeys<DatabaseState>({
  createdAt: true,
  updatedAt: true,
  uuid: true,
  config: true,
  dependsOn: true,
});

const configAttributes = ensureAllKeys<DatabaseConfig>({
  locationHint: true,
});
const configPaths = configAttributes.map((attribute) => `config.${attribute}`);
const possibleAttributes = [
  ...stateAttributes,
  ...configPaths,
];
const possibleAttributePattern = possibleAttributes.join("|");

const namePattern = `^(?<name>[a-z0-9][a-z0-9-_]+)`;
const attributePattern = `(?:\\.(?<attributePath>${possibleAttributePattern}))?$`;

const pattern = new RegExp(namePattern + attributePattern);

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
