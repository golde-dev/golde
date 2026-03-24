import { ensureAllowedKeys } from "@/utils/object.ts";
import { matchFactory } from "@/generic/path.ts";
import type { ObjectConfig, ObjectState } from "@/generic/resources/s3/object/types.ts";

export const BASE_PATH = "cloudflare.r2.object";

const stateAttributes = ensureAllowedKeys<ObjectState>({
  createdAt: true,
  key: true,
  updatedAt: true,
  version: true,
}).map((attribute) => `${attribute}`);

const configAttributes = ensureAllowedKeys<ObjectConfig>({
  bucketName: true,
  source: true,
  version: true,
  maxVersions: true,
  context: true,
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const {
  matchResourceType,
  resourcePath,
  removeResourcePrefix,
} = matchFactory(BASE_PATH, "Cloudflare", "R2 object", stateAttributes, configAttributes);

export {
  matchResourceType as matchR2Object,
  removeResourcePrefix as removeR2ObjectPrefix,
  resourcePath as r2ObjectPath,
};
