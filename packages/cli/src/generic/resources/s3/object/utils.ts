import { copy, ensureDir, exists } from "@std/fs";
import { dirname, join } from "@std/path";
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
  name: string,
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
  name: string,
  includes: Include[] = [],
): Promise<string> {
  const tmpDir = await Deno.makeTempDir({
    prefix: "golde-bucket-object-",
  });

  for (const { from, to } of includes) {
    const fromPath = join(context, from);
    const toPath = join(tmpDir, to);

    ensureDir(dirname(toPath));

    if (await exists(fromPath)) {
      await copy(fromPath, toPath);
    } else {
      throw new PlanError(
        `Bucket object include ${from} does not exist`,
        PlanErrorCode.SOURCE_NOT_FOUND,
      );
    }
  }

  return tmpDir;
}

export async function getObject(name: string, config: ObjectConfig): Promise<Object> {
  const {
    source,
    includes,
    version,
    context = ".",
  } = config;

  const path = source
    ? await createFromSource(context, name, source)
    : await createFromIncludes(context, name, includes);

  const newVersion = await getVersion(path, context, version);

  return {
    path,
    version: newVersion,
  };
}
