import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../utils/object.ts";
import { PlanError, PlanErrorCode } from "../../../error.ts";
import type { ZoneConfig, ZoneState } from "./types.ts";

export const BASE_PATH = "hcloud.dns.zone";

export function zonePath(name: string): string {
  return prefixPath(BASE_PATH, name);
}

export function removeZonePrefix(path: string): string {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllowedKeys<ZoneState>({
  id: true,
  name: true,
  mode: true,
  ttl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// `mode` and `ttl` overlap with state attributes — exclude from config-prefix
// paths so the regex doesn't mis-split (e.g. `golde.dev.config.ttl`).
type ZoneConfigAttributes = Pick<ZoneConfig, "branch" | "branchPattern">;

const configAttributes = ensureAllowedKeys<ZoneConfigAttributes>({
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const possibleAttributes = [
  ...stateAttributes,
  ...configAttributes,
];
const possibleAttributePattern = possibleAttributes.join("|");

const pattern = new RegExp(
  `^(?<name>.+)\\.(?<attributePath>${possibleAttributePattern})$`,
);

export function matchHCloudZone(path: string): [string, string, string] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const rest = removeZonePrefix(path);
  const match = pattern.exec(rest);

  if (!match) {
    throw new PlanError(
      `Incorrect HCloud Zone path: ${path}`,
      PlanErrorCode.INCORRECT_PATH,
    );
  }
  const { groups: { name, attributePath } = {} } = match;
  return [
    zonePath(name),
    name,
    attributePath,
  ];
}
