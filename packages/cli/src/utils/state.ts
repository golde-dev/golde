import { get, set } from "@es-toolkit/es-toolkit/compat";
import { removePrefix } from "@/utils/object.ts";
import type { ResourceState } from "@/types/config.ts";
import type { SavedResource } from "@/types/dependencies.ts";
import type { State } from "@/types/state.ts";

const AWS_RESOURCES = [
  "aws.s3.bucket",
  "aws.cloudwatch.logGroup",
  "aws.lambda.function",
  "aws.iam.role",
  "aws.iam.user",
];
const AWS_VERSIONED_RESOURCES = [
  "aws.s3.object",
];

const CLOUDFLARE_RESOURCES = [
  "cloudflare.r2.bucket",
  "cloudflare.d1.database",
];

const CLOUDFLARE_RESOURCES_VERSIONED = [
  "cloudflare.r2.object",
];

const GITHUB_RESOURCES_VERSIONED = [
  "github.registry.dockerImage",
];

const CLOUDFLARE_DNS_PATH = "cloudflare.dns.record";
const DNS_RECORD_TYPES = new Set([
  "A", "AAAA", "CAA", "CNAME", "DKIM", "DMARC", "DNSKEY",
  "DS", "MX", "NS", "PTR", "SOA", "SPF", "SRV", "SVCB", "TXT",
]);

const SIMPLE = [
  ...CLOUDFLARE_RESOURCES,
  ...AWS_RESOURCES,
];

const VERSIONED = [
  ...CLOUDFLARE_RESOURCES_VERSIONED,
  ...AWS_VERSIONED_RESOURCES,
  ...GITHUB_RESOURCES_VERSIONED,
];

type SimpleResource = Record<string, object>;
type VersionedResource = {
  current: string | null;
  versions: Record<string, object>;
};

export function resourcesToState(
  resources: SavedResource[],
) {
  const resultedState: State = {};

  resourcesLoop: for (const { path, state, isCurrent, version } of resources) {
    // Handle DNS records specially due to nested zone/type/name structure
    if (path.startsWith(CLOUDFLARE_DNS_PATH)) {
      const resourceName = removePrefix(CLOUDFLARE_DNS_PATH, path);
      const parts = resourceName.split(".");

      // Find the record type part (e.g., "A", "AAAA", "CNAME")
      const typeIndex = parts.findIndex((p) => DNS_RECORD_TYPES.has(p));
      if (typeIndex === -1) {
        throw new Error(`Invalid DNS record path, no record type found: ${path}`);
      }

      const zone = parts.slice(0, typeIndex).join(".");
      const recordType = parts[typeIndex];
      const name = parts.slice(typeIndex + 1).join(".");

      // deno-lint-ignore no-explicit-any
      const dnsState: Record<string, Record<string, Record<string, any>>> = get(resultedState, CLOUDFLARE_DNS_PATH, {});
      if (!dnsState[zone]) dnsState[zone] = {};
      if (!dnsState[zone][recordType]) dnsState[zone][recordType] = {};
      dnsState[zone][recordType][name] = state;
      set(resultedState, CLOUDFLARE_DNS_PATH, dnsState);

      continue resourcesLoop;
    }

    for (const resourceTypePath of SIMPLE) {
      if (path.startsWith(resourceTypePath)) {
        const resourceName = removePrefix(resourceTypePath, path);

        const currentResourceType = get(
          resultedState,
          resourceTypePath,
          {} as Record<string, SimpleResource>,
        );
        currentResourceType[resourceName] = state as ResourceState;
        set(resultedState, resourceTypePath, currentResourceType);

        continue resourcesLoop;
      }
    }

    for (const resourceTypePath of VERSIONED) {
      if (path.startsWith(resourceTypePath)) {
        const resourceName = removePrefix(resourceTypePath, path);

        if (!version) {
          throw new Error(`Version is required in ${resourceTypePath} path: ${path}`);
        }

        const currentResourceType = get(
          resultedState,
          resourceTypePath,
          {} as Record<string, VersionedResource>,
        );
        if (!currentResourceType[resourceName]) {
          currentResourceType[resourceName] = {
            current: null,
            versions: {},
          };
        }
        const currentVersion = currentResourceType[resourceName].current;
        const currentVersions = currentResourceType[resourceName].versions;

        currentResourceType[resourceName] = {
          current: isCurrent ? version : currentVersion,
          versions: {
            ...currentVersions,
            [version]: state,
          },
        };
        set(resultedState, resourceTypePath, currentResourceType);

        continue resourcesLoop;
      }
    }
    throw new Error(`Unknown resource type: ${path}`);
  }
  return resultedState;
}
