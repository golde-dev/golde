import { createReadStream, rmSync } from "fs";
import { createNativeTar } from "./utils/tar.js";
import { createTar } from "./utils/tar.js";
import logger from "./logger.js";
import { join } from "path";
import type { StateProvider } from "./providers/state.js";
import type { Context } from "./context.js";

const tarArtifacts = async(searchPaths: string[], tarFilePath: string, tarFn: typeof createNativeTar) => {
  const startTar = Date.now();
  await tarFn(searchPaths, tarFilePath);
  const endTar = Date.now();

  const tarDuration = endTar - startTar;
  logger.info(`Created tar for artifacts: ${tarFilePath} in ${tarDuration}ms`);  
};

const uploadTar = async(state: StateProvider, tarFilePath: string, s3Path: string) => {
  const readStream = createReadStream(tarFilePath);

  const startS3 = Date.now();
  await state.putObject(s3Path, readStream);
  const endS3 = Date.now();

  const s3Duration = endS3 - startS3;
  logger.info(`Pushed artifacts to s3: ${s3Path} in ${s3Duration}ms`);
};

const artifactsBasePath = "/artifacts";

export const pushArtifacts = async(
  {
    state,
  }: Context,
  searchPaths: string[], 
  app: string,
  version: string,
  path: string
) => {
  const localPath = join(path, app);
  const s3BasePath = join(artifactsBasePath, app);
  
  rmSync(localPath, {force: true, recursive: true});

  const ext = process.platform === "linux" 
    ? "zst"
    : "br";
  
  const tarFilePath = `${localPath}/${version}.tar.${ext}`;
  const s3Path = `${s3BasePath}/${version}.tar.${ext}`;

  if (ext === "zst") {
    await tarArtifacts(searchPaths, tarFilePath, createNativeTar);
  }
  else {
    await tarArtifacts(searchPaths, tarFilePath, createTar);
  }

  // @ts-expect-error to be fixed when state will not be optional
  await uploadTar(state, tarFilePath, s3Path);
};