import type { Resource, SavedResource } from "@/types/dependencies.ts";
import type { State } from "@/types/state.ts";
import { get, set } from "@es-toolkit/es-toolkit/compat";
import { removePrefix } from "@/utils/object.ts";
import { ResourceState } from "@/types/config.ts";

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

const SIMPLE = [
  ...CLOUDFLARE_RESOURCES,
  ...AWS_RESOURCES,
];

const VERSIONED = [
  ...CLOUDFLARE_RESOURCES_VERSIONED,
  ...AWS_VERSIONED_RESOURCES,
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
