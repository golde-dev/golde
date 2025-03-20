import { logger } from "@/logger.ts";
import { copy, exists } from "@std/fs";
import { basename, join, resolve } from "@std/path";
import { tar, tgz, zip } from "@deno-library/compress";
import { PlanError, PlanErrorCode } from "@/error.ts";
import {
  getFileHashVersion,
  getGitContextVersion,
  getGitVersion,
  getLastUpdatedVersion,
} from "@/utils/version.ts";
import type { Include, Object, ObjectConfig, Version } from "./types.ts";

async function getVersion(
  path: string,
  context: string,
  version: Version = "FileHash",
): Promise<string> {
  if (version === "FileHash") {
    return await getFileHashVersion(path);
  }
  if (version === "LastUpdated") {
    return await getLastUpdatedVersion(path);
  }
  if (version === "GitHash") {
    return await getGitVersion();
  }
  if (version === "ContextGitHash") {
    return await getGitContextVersion(context);
  }
  throw new Error(`Not implemented: ${version}`);
}

async function compress(path: string, name: string) {
  // TODO: zip is not working issue with workers
  if (name.endsWith(".zip")) {
    const archivePath = `${path}.zip`;
    logger.debug(`[Plan] Object ${name} compressing ${path} to ${archivePath}`);
    await zip.compress(path, archivePath);
    return archivePath;
  }
  if (name.endsWith(".tar.gz")) {
    const archivePath = `${path}.tar.gz`;
    logger.debug(`[Plan] Object ${name} compressing ${path} to ${archivePath}`);
    await tgz.compress(path, archivePath);
    return archivePath;
  }
  if (name.endsWith(".tar")) {
    const archivePath = `${path}.tar`;
    logger.debug(`[Plan] Object ${name} compressing ${path} to ${archivePath}`);
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
  const contextBase = resolve(context);
  const fromPath = join(contextBase, source);

  if (!await exists(fromPath)) {
    throw new PlanError(
      `Bucket object ${name}, source ${source} does not exist`,
      PlanErrorCode.SOURCE_NOT_FOUND,
    );
  }

  try {
    const tmpDir = await Deno.makeTempDir({
      prefix: `golde-bucket-object-${name}`,
    });
    const toPath = join(tmpDir, basename(fromPath));
    logger.debug(`Object ${name} Copying ${fromPath} to ${tmpDir}`);

    await copy(fromPath, toPath, {
      preserveTimestamps: true,
      overwrite: true,
    });
    return await compress(toPath, name);
  } catch (error) {
    throw new PlanError(
      `Bucket object ${name}, source ${source} failed`,
      PlanErrorCode.SOURCE_ERROR,
      error,
    );
  }
}

async function createFromIncludes(
  context: string,
  name: string,
  includes: Include[] = [],
): Promise<string> {
  const tmpDir = await Deno.makeTempDir({
    prefix: `golde-bucket-object-${name}`,
  });
  const contextBase = resolve(context);

  try {
    for (const { from, to } of includes) {
      const fromPath = join(contextBase, from);
      const toPath = join(tmpDir, to);

      logger.debug(`[Plan] Object ${name} Copying ${fromPath} to ${toPath}`);

      if (!await exists(fromPath)) {
        throw new PlanError(
          `[Plan] Bucket object ${name}, include ${from} does not exist`,
          PlanErrorCode.SOURCE_NOT_FOUND,
        );
      }

      if (toPath !== tmpDir) {
        await copy(fromPath, toPath, { preserveTimestamps: true });
        continue;
      }

      const fromStat = Deno.lstatSync(fromPath);

      if (fromStat.isFile) {
        const fileToPath = join(tmpDir, basename(fromPath));
        await copy(fromPath, fileToPath, {
          preserveTimestamps: true,
          overwrite: false,
        });
        continue;
      }

      if (fromStat.isDirectory) {
        for (const entry of Deno.readDirSync(fromPath)) {
          const entryFromPath = join(fromPath, entry.name);
          const entryToPath = join(tmpDir, entry.name);

          await copy(entryFromPath, entryToPath, {
            preserveTimestamps: true,
            overwrite: false,
          });
        }
        continue;
      }

      throw new Error(`Object ${name}, include ${from} is not a file or directory`);
    }
    return await compress(tmpDir, name);
  } catch (error) {
    throw new PlanError(
      `Bucket object ${name}, include failed`,
      PlanErrorCode.SOURCE_ERROR,
      error,
    );
  }
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
