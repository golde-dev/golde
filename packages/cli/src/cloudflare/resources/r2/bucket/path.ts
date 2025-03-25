import { ensureAllowedKeys } from "../../../../utils/object.ts";
import type { BucketConfig, BucketState } from "./types.ts";
import { matchFactory } from "@/generic/path.ts";

export const BASE_PATH = "cloudflare.r2.bucket";

const stateAttributes = ensureAllowedKeys<BucketState>({
  name: true,
  createdAt: true,
  updatedAt: true,
  location: true,
}).map((attribute) => `${attribute}`);

const configAttributes = ensureAllowedKeys<BucketConfig>({
  locationHint: true,
  storageClass: true,
  branch: true,
  branchPattern: true,
}).map((attribute) => `config.${attribute}`);

const {
  matchResourceType,
  resourcePath,
  removeResourcePrefix,
} = matchFactory(BASE_PATH, "Cloudflare", "R2 bucket", stateAttributes, configAttributes);

export {
  matchResourceType as matchR2Bucket,
  removeResourcePrefix as removeR2BucketPrefix,
  resourcePath as r2BucketPath,
};
