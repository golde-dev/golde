import { trimStart } from "@es-toolkit/es-toolkit";
import { ensureAllKeys, prefixPath, removePrefix } from "../../utils/object.ts";
import type { RecordConfig, RecordState } from "./types.ts";

const BASE_PATH = "cloudflare.dnsRecord";

export function dnsPath(zone: string, type: string, name: string) {
  const prefixedBasePath = prefixPath(BASE_PATH, zone);
  const prefixedTypePath = prefixPath(prefixedBasePath, type);
  const prefixedNamePath = prefixPath(prefixedTypePath, name);
  return prefixedNamePath;
}
export function dnsRecordPath(zone: string, type: string, name: string) {
  const prefixedBasePath = prefixPath("", zone);
  const prefixedTypePath = prefixPath(prefixedBasePath, type);
  const prefixedNamePath = prefixPath(prefixedTypePath, name);
  return prefixedNamePath;
}

export function removeDNSPrefix(path: string) {
  return removePrefix(BASE_PATH, path);
}

const stateAttributes = ensureAllKeys<RecordState>({
  id: true,
  zoneId: true,
  updatedAt: true,
  createdAt: true,
  config: true,
});

const configAttributes = ensureAllKeys<RecordConfig>({
  "value": true,
  "ttl": true,
  "proxied": true,
  "comment": true,
  "tags": true,
});

const configPaths = configAttributes.map((attribute) => `config.${attribute}`);

const possibleAttributes = [
  ...stateAttributes,
  ...configPaths,
];

const possibleAttributePattern = possibleAttributes.join("|");

const zoneTypePattern = new RegExp(
  String.raw`^\['(?<zone>[a-zA-Z0-9.-]+)'\]\.(?<type>[A-Z]+)(?<rest>.*)$`,
);
const namePattern = String.raw`^(?:\['(?<name>[A-Za-z0-9._-]+)'\]|(?<name>[A-Za-z0-9_-]+|@))`;
const attributePattern = String.raw`(?:\.(?<attributePath>${possibleAttributePattern}))?$`;

const restPattern = new RegExp(namePattern + attributePattern);

export function matchDNSRecord(path: string): [string, string, string | null] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const dns = removeDNSPrefix(path);

  const matchZone = zoneTypePattern.exec(dns);
  if (!matchZone) {
    throw new Error(`Incorrect Cloudflare DNS record path: ${path}`);
  }
  const {
    groups: { type, zone, rest } = {},
  } = matchZone;

  const matchRest = restPattern.exec(trimStart(rest, "."));

  if (!matchRest) {
    throw new Error(`Incorrect Cloudflare DNS record path: ${path}`);
  }
  const {
    groups: { name, attributePath = null } = {},
  } = matchRest;

  return [
    dnsPath(zone, type, name),
    dnsRecordPath(zone, type, name),
    attributePath,
  ];
}
