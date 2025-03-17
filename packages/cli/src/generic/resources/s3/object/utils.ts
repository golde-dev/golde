import { copy, ensureDir, exists } from "@std/fs";
import { dirname, join } from "@std/path";
import { tar, tgz, zip } from "jsr:@deno-library/compress";
import { getRefHash } from "@/utils/git.ts";
import { hashFile } from "@/utils/hash.ts";
import { PlanError, PlanErrorCode } from "@/error.ts";
import type { Include, Object, ObjectConfig, Version } from "./types.ts";
import { logger } from "@/logger.ts";

async function getLastUpdated(path: string) {
  const { mtime } = await Deno.lstat(path);
  if (!mtime) {
    throw new Error(`Failed to get last updated for ${path}`);
  }
  return mtime.toString();
}

async function getVersion(
  path: string,
  context: string,
  version: Version = "FileHash",
): Promise<string> {
  if (version === "FileHash") {
    return await hashFile(path);
  }
  if (version === "LastUpdated") {
    return await getLastUpdated(path);
  }
  if (version === "GitHash") {
    return await getRefHash();
  }
  if (version === "ContextGitHash") {
    return await getRefHash(context);
  }
  throw new Error(`Not implemented: ${version}`);
}

async function compress(path: string, name: string) {
  if (name.endsWith(".zip")) {
    const archivePath = join(path, `zip`);
    logger.debug(`Object ${name} Compressing ${path} to ${archivePath}`);
    await zip.compress(path, archivePath);
    return archivePath;
  }
  if (name.endsWith(".tar.gz")) {
    const archivePath = join(path, `tar.gz`);
    logger.debug(`Object ${name} Compressing ${path} to ${archivePath}`);
    await tgz.compress(path, archivePath);
    return archivePath;
  }
  if (name.endsWith(".tar")) {
    const archivePath = join(path, `.tar`);
    logger.debug(`Object ${name} Compressing ${path} to ${archivePath}`);
    await tar.compress(path, archivePath);
    return archivePath;
  }
  return path;
}

async function createFromSource(
  context: string,
  name: string,
  source: string,
): Promise<string> {
  const path = join(context, source);
  if (await exists(path)) {
    const tmpDir = await Deno.makeTempDir({
      prefix: `golde-bucket-object-${name}`,
    });
    logger.debug(`Object ${name} Copying ${path} to ${tmpDir}`);
    await copy(path, tmpDir, { preserveTimestamps: true });
    return await compress(path, name);
  }
  throw new PlanError(
    `Bucket object ${name}, source ${source} does not exist`,
    PlanErrorCode.SOURCE_NOT_FOUND,
  );
}

async function createFromIncludes(
  context: string,
  name: string,
  includes: Include[] = [],
): Promise<string> {
  const tmpDir = await Deno.makeTempDir({
    prefix: `golde-bucket-object-${name}`,
  });

  for (const { from, to } of includes) {
    const fromPath = join(context, from);
    const toPath = join(tmpDir, to);

    ensureDir(dirname(toPath));

    if (await exists(fromPath)) {
      logger.debug(`Object ${name} Copying ${fromPath} to ${toPath}`);
      await copy(fromPath, toPath, { preserveTimestamps: true });
    } else {
      throw new PlanError(
        `Bucket object ${name}, include ${from} does not exist`,
        PlanErrorCode.SOURCE_NOT_FOUND,
      );
    }
  }

  return await compress(tmpDir, name);
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
