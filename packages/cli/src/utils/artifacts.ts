import { rmSync } from "node:fs";
import { createNativeTar } from "./tar.ts";
import { createTar } from "./tar.ts";
import { logger } from "../logger.ts";
import { join } from "node:path";
import type { StateProvider } from "../providers/state.ts";
import type { Context } from "../context.ts";
import type { GoldeProvider } from "../providers/golde.ts";

export const getArtifactKey = (project: string, key: string) => {
  return `/${project}/artifacts/${key}`;
};

const tarArtifacts = async (
  searchPaths: string[],
  tarFilePath: string,
  tarFn: typeof createNativeTar,
) => {
  const startTar = Date.now();
  await tarFn(searchPaths, tarFilePath);
  const endTar = Date.now();

  const tarDuration = endTar - startTar;
  logger.info(`Created tar for artifacts: ${tarFilePath} in ${tarDuration}ms`);
};

const uploadTar = async (
  state: GoldeProvider | StateProvider,
  tarFilePath: string,
  s3Path: string,
) => {
  const startS3 = Date.now();
  // await state.uploadArtefact(tarFilePath, s3Path);
  const endS3 = Date.now();

  const s3Duration = endS3 - startS3;
  logger.info(`Pushed artifacts to s3: ${s3Path} in ${s3Duration}ms`);
};

export const pushArtifacts = async (
  {
    state,
  }: Context,
  searchPaths: string[],
  app: string,
  version: string,
  path: string,
) => {
  const localPath = join(path, app);
  const s3BasePath = join(app);

  rmSync(localPath, { force: true, recursive: true });

  const ext = Deno.build.os === "linux" ? "zst" : "br";

  const tarFilePath = `${localPath}/${version}.tar.${ext}`;
  const s3Path = `${s3BasePath}/${version}.tar.${ext}`;

  if (ext === "zst") {
    await tarArtifacts(searchPaths, tarFilePath, createNativeTar);
  } else {
    await tarArtifacts(searchPaths, tarFilePath, createTar);
  }

  await uploadTar(state, tarFilePath, s3Path);
};
