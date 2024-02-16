import { createReadStream, rmSync } from "fs";
import { tarPaths } from "./tar.js";
import s3 from "./s3.js";
import { basename } from "path";
import { getCurrentHash } from "./git.js";
import logger from "./logger.js";

export const pushArtifacts = async(searchPaths: string[], app = "") => {
  const tarFilePath = `/tmp/${app}/${getCurrentHash()}.tar.zst`;

  const startTar = Date.now();
  tarPaths(searchPaths, tarFilePath);
  const endTar = Date.now();
  logger.info(`Created tar for artifacts: ${tarFilePath} in ${endTar-startTar}ms`);  

  const readStream = createReadStream(tarFilePath);
  const objectName = basename(tarFilePath);
  const fileName = `/artifacts/${app}/${objectName}`;

  const startS3 = Date.now();
  await s3.putObject(fileName, readStream);
  const endS3 = Date.now();
  logger.info(
    `Pushed artifacts to s3: ${fileName} in ${endS3-startS3}ms`
  );
  rmSync(tarFilePath, {force: true});
};