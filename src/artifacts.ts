import { createReadStream } from "fs";
import { tarPaths } from "./tar.js";
import { putObject } from "./s3.js";
import { basename } from "path";
import { getBranchName, getCurrentHash } from "./git.js";
import logger from "./logger.js";

export const pushArtifacts = async(searchPaths: string[]) => {
  const tarFilePath = `/tmp/${getBranchName()}.${getCurrentHash()}.tar.zst`;

  const startTar = Date.now();
  tarPaths(searchPaths, tarFilePath);
  const endTar = Date.now();
  logger.info(`Created tar for artifacts: ${tarFilePath} in ${endTar-startTar}ms`);  

  const readStream = createReadStream(tarFilePath);
  const objectName = basename(tarFilePath);
  const fileName = `/artifacts/${objectName}`;

  const startS3 = Date.now();
  await putObject(fileName, readStream);
  const endS3 = Date.now();
  logger.info(
    `Pushed artifacts to s3: ${fileName} in ${endS3-startS3}ms`
  );
};