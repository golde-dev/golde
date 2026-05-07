import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../utils/object.ts";
import { PlanError, PlanErrorCode } from "../../../error.ts";
import type { ServerConfig, ServerState } from "./types.ts";

export const BASE_PATH = "hcloud.server";

export function serverPath(name: string): string {
  return prefixPath(BASE_PATH, name);
}

export function removeServerPrefix(path: string): string {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllowedKeys<ServerState>({
  id: true,
  name: true,
  ipv4: true,
  ipv6: true,
  status: true,
  datacenter: true,
  location: true,
  createdAt: true,
  updatedAt: true,
});

const configAttributes = ensureAllowedKeys<ServerConfig>({
  image: true,
  serverType: true,
  location: true,
  datacenter: true,
  userData: true,
  enableIpv4: true,
  enableIpv6: true,
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

export function matchHCloudServer(path: string): [string, string, string] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const serverPathRest = removeServerPrefix(path);
  const match = pattern.exec(serverPathRest);

  if (!match) {
    throw new PlanError(
      `Incorrect HCloud Server path: ${path}`,
      PlanErrorCode.INCORRECT_PATH,
    );
  }
  const { groups: { name, attributePath } = {} } = match;

  return [
    serverPath(name),
    name,
    attributePath,
  ];
}
