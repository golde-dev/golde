import { logger } from "@/logger.ts";
import { copy, exists } from "@std/fs";
import { basename, join, resolve } from "@std/path";
import { tar, tgz, zip } from "@deno-library/compress";
import { PlanError, PlanErrorCode } from "@/error.ts";
import {
  getDirHashVersion,
  getFileHashVersion,
  getGitContextVersion,
  getGitVersion,
  getLastUpdatedVersion,
} from "@/utils/version.ts";
import type { Include, Object, ObjectConfig, Version } from "./types.ts";
import slugify from "@sindresorhus/slugify";
import { memoizeAsync } from "@/utils/memoize.ts";

async function getVersion(
  path: string,
  context: string,
  version: Version = "FileHash",
): Promise<string> {
  if (version === "LastUpdated") {
    return await getLastUpdatedVersion(path);
  }
  if (version === "GitHash") {
    return await getGitVersion();
  }
  if (version === "ContextGitHash") {
    return await getGitContextVersion(context);
  }
  if (version === "FileHash") {
    const stat = await Deno.lstat(path);
    if (stat.isFile) {
      return await getFileHashVersion(path);
    }
    if (stat.isDirectory) {
      return await getDirHashVersion(path);
    }
    throw new Error(`Not implemented for this type of file: ${version}`);
  }
  throw new Error(`Not implemented: ${version}`);
}

async function compress(path: string, name: string) {
  // TODO: zip is not working issue with workers
  if (name.endsWith(".zip")) {
    const archivePath = `${path}.zip`;
    logger.debug(`[Plan] Object ${name} compressing`, {
      from: path,
      to: archivePath,
    });
    await zip.compress(path, archivePath);
    return archivePath;
  }
  if (name.endsWith(".tar.gz")) {
    const archivePath = `${path}.tar.gz`;
    logger.debug(`[Plan] Object ${name} compressing `, {
      from: path,
      to: archivePath,
    });
    await tgz.compress(path, archivePath);
    return archivePath;
  }
  if (name.endsWith(".tar")) {
    const archivePath = `${path}.tar`;
    logger.debug(`[Plan] Object ${name} compressing`, {
      from: path,
      to: archivePath,
    });
    await tar.compress(path, archivePath);
    return archivePath;
  }
  return path;
}

async function createFromSource(
  context: string,
  name: string,
  source: string,
  version?: Version,
): Promise<[string, string]> {
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
    logger.debug(`[Plan] Object ${name} copying`, {
      from: fromPath,
      to: toPath,
    });

    await copy(fromPath, toPath, {
      preserveTimestamps: true,
      overwrite: true,
    });
    const archivePath = await compress(toPath, name);
    const newVersion = await getVersion(toPath, context, version);
    return [archivePath, newVersion];
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
  version?: Version,
): Promise<[string, string]> {
  const tmpDir = await Deno.makeTempDir({
    prefix: `golde-bucket-object-${name}`,
  });
  const contextBase = resolve(context);

  try {
    for (const { from, to } of includes) {
      const fromPath = join(contextBase, from);
      const toPath = join(tmpDir, to);

      if (!await exists(fromPath)) {
        throw new PlanError(
          `[Plan] Bucket object ${name}, include ${from} does not exist`,
          PlanErrorCode.SOURCE_NOT_FOUND,
        );
      }

      if (toPath !== tmpDir) {
        logger.debug(`Object ${name} copying`, {
          from: fromPath,
          to: toPath,
        });
        await copy(fromPath, toPath, { preserveTimestamps: true });
        continue;
      }

      const fromStat = Deno.lstatSync(fromPath);

      if (fromStat.isFile) {
        const fileToPath = join(tmpDir, basename(fromPath));
        logger.debug(`Object ${name} copying`, {
          from: fromPath,
          to: fileToPath,
        });
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

          logger.debug(`Object ${name} copying`, {
            from: entryFromPath,
            to: entryToPath,
          });

          await copy(entryFromPath, entryToPath, {
            preserveTimestamps: true,
            overwrite: false,
          });
        }
        continue;
      }

      throw new Error(`Object ${name}, include ${from} is not a file or directory`);
    }
    const archivePath = await compress(tmpDir, name);
    const newVersion = await getVersion(tmpDir, context, version);

    return [archivePath, newVersion];
  } catch (error) {
    throw new PlanError(
      `Bucket object ${name}, include failed`,
      PlanErrorCode.SOURCE_ERROR,
      error,
    );
  }
}

export const createObject = memoizeAsync(
  async (name: string, config: ObjectConfig): Promise<Object> => {
    const {
      source,
      includes,
      version,
      context = ".",
    } = config;

    const [path, newVersion] = source
      ? await createFromSource(context, name, source, version)
      : await createFromIncludes(context, name, includes, version);

    return {
      path,
      version: newVersion,
    };
  },
);

export function createObjectKey(branch: string, version: string, name: string) {
  const key = `${slugify(branch)}.${version}.${slugify(name)}`;
  if (key.length > 1024) {
    throw new Error(`Object key is too long for s3 object: ${key}`);
  }
  return key;
}
