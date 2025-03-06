import { exists } from "@std/fs";
import { join } from "@std/path";
import { getRefHash } from "../../../../utils/git.ts";
import { hashFile } from "../../../../utils/hash.ts";
import { PlanError, PlanErrorCode } from "../../../../error.ts";
import type { Include, Object, ObjectConfig, Version } from "./types.ts";

async function getVersion(
  path: string,
  context: string,
  version: Version = "ObjectHash",
): Promise<string> {
  if (version === "ObjectHash") {
    return await hashFile(path);
  }
  if (version === "GitHash") {
    return await getRefHash();
  }
  if (version === "ContextGitHash") {
    return await getRefHash(context);
  }
  throw new Error("Not implemented");
}

async function createFromSource(
  context: string,
  source: string,
): Promise<string> {
  const path = join(context, source);
  if (await exists(path)) {
    return path;
  }
  throw new PlanError(`Source ${source} does not exist`, PlanErrorCode.SOURCE_NOT_FOUND);
}

async function createFromIncludes(
  context: string,
  includes: Include[] = [],
): Promise<string> {
  throw await Promise.reject(new Error("Not implemented"));
}

export async function getObject(config: ObjectConfig): Promise<Object> {
  const {
    source,
    includes,
    version,
    context = ".",
  } = config;

  const path = source
    ? await createFromSource(context, source)
    : await createFromIncludes(context, includes);

  const newVersion = await getVersion(path, context, version);

  return {
    path,
    version: newVersion,
  };
}
