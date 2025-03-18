import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../../utils/object.ts";
import type { RecordConfig, RecordState, RecordType } from "./types.ts";

const BASE_PATH = "cloudflare.dns.record";

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

const recordTypes: RecordType[] = [
  "A",
  "AAAA",
  "CAA",
  "CNAME",
  "DKIM",
  "DMARC",
  "DNSKEY",
  "DS",
  "MX",
  "NS",
  "PTR",
  "SOA",
  "SPF",
  "SRV",
  "SVCB",
  "TXT",
];
const recordTypePattern = recordTypes.join("|");

const stateAttributes = ensureAllowedKeys<RecordState>({
  id: true,
  zoneId: true,
  updatedAt: true,
  createdAt: true,
});

const configAttributes = ensureAllowedKeys<RecordConfig>({
  value: true,
  ttl: true,
  proxied: true,
  comment: true,
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const configPaths = configAttributes;

const possibleAttributes = [
  ...stateAttributes,
  ...configPaths,
];
const possibleAttributePattern = possibleAttributes.join("|");

const pattern = new RegExp(
  `^(?<tld>(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,})\\.(?<recordType>${recordTypePattern})\\.(?<name>.*?)\\.(?<attributePath>${possibleAttributePattern})$`,
);

export function matchDNSRecord(path: string): [string, string, string] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const dns = removeDNSPrefix(path);

  const match = pattern.exec(dns);

  if (!match) {
    throw new Error(`Incorrect Cloudflare DNS Record path: ${path}`);
  }

  const {
    groups: { tld, recordType, name, attributePath } = {},
  } = match;

  return [
    dnsPath(tld, recordType, name),
    dnsRecordPath(tld, recordType, name),
    attributePath,
  ];
}
