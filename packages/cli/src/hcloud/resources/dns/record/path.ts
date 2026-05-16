import { ensureAllowedKeys, prefixPath, removePrefix } from "../../../../utils/object.ts";
import { PlanError, PlanErrorCode } from "../../../../error.ts";
import type { RecordConfig, RecordState, RecordType } from "./types.ts";

export const BASE_PATH = "hcloud.dns.record";

export function dnsPath(zone: string, type: string, name: string): string {
  const withZone = prefixPath(BASE_PATH, zone);
  const withType = prefixPath(withZone, type);
  return prefixPath(withType, name);
}

export function dnsRecordPath(zone: string, type: string, name: string): string {
  const withZone = prefixPath("", zone);
  const withType = prefixPath(withZone, type);
  return prefixPath(withType, name);
}

export function removeDNSPrefix(path: string): string {
  return removePrefix(BASE_PATH, path);
}

const recordTypes: RecordType[] = [
  "A",
  "AAAA",
  "CAA",
  "CNAME",
  "DS",
  "HINFO",
  "HTTPS",
  "MX",
  "NS",
  "PTR",
  "RP",
  "SOA",
  "SRV",
  "SVCB",
  "TLSA",
  "TXT",
];
const recordTypePattern = recordTypes.join("|");

// `type` and `ttl` overlap with config — exclude them from state-attr
// whitelist; the regex prefers the `config.<name>` form for those.
type RecordStateAttributes = Pick<
  RecordState,
  "zoneName" | "rrsetId" | "name" | "createdAt" | "updatedAt"
>;
const stateAttributes = ensureAllowedKeys<RecordStateAttributes>({
  zoneName: true,
  rrsetId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
});

// `ttl` overlaps with state — exclude from configAttributes.
type RecordConfigAttributes = Pick<RecordConfig, "comment" | "branch" | "branchPattern">;
const configAttributes = ensureAllowedKeys<RecordConfigAttributes>({
  comment: true,
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const possibleAttributes = [
  ...stateAttributes,
  ...configAttributes,
];
const possibleAttributePattern = possibleAttributes.join("|");

const pattern = new RegExp(
  `^(?<tld>(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,})\\.(?<recordType>${recordTypePattern})\\.(?<name>.*?)\\.(?<attributePath>${possibleAttributePattern})$`,
);

export function matchHCloudDNSRecord(
  path: string,
): [string, string, string] | undefined {
  if (!path.startsWith(BASE_PATH)) {
    return;
  }
  const rest = removeDNSPrefix(path);
  const match = pattern.exec(rest);

  if (!match) {
    throw new PlanError(
      `Incorrect HCloud DNS Record path: ${path}`,
      PlanErrorCode.INCORRECT_PATH,
    );
  }
  const { groups: { tld, recordType, name, attributePath } = {} } = match;

  return [
    dnsPath(tld, recordType, name),
    dnsRecordPath(tld, recordType, name),
    attributePath,
  ];
}
