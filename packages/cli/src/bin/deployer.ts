/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Command } from "commander";
import { existsSync } from "fs";
import { pushArtifacts } from "../artifacts.js";
import type { Config } from "../types/config.js";
import { getCurrentHash } from "../git.js";
import logger from "../logger.js";
import { cwd } from "process";
import { resolve } from "path";

const pwd = cwd();

const getConfig = async(): Promise<Config> => {
  if (existsSync(`${pwd}/deployer.config.cjs`)) {
    return require(`${pwd}/deployer.config.cjs`);
  }
  if (existsSync(`${pwd}/deployer.config.json`)) {
    return require(`${pwd}/deployer.config.json`);
  }
  if (existsSync("./deployer.config.js")) {
    throw new Error("Not implemented");
  }
  if (existsSync("./deployer.config.ts")) {
    throw new Error("Not implemented");
  }
  logger.error("Missing config files");
  throw new Error("No error");
};

const program = new Command();

program
  .name("deployer")
  .description("CLI to manager deployer")
  .version("0.8.0");

program
  .command("push")
  .description("push artifacts and config")
  .option("-d, --debug", "enable debug mode")
  .option("-p, --path <path>", "path for build artifacts", "/tmp")
  .action(async function({debug, path}: {debug: boolean, path: string} ) {
    if (debug) {
      logger.level = "debug";
    }
    const config = await getConfig();
    const version = getCurrentHash();
    const fullPath = resolve(path);
    
    await Promise.all(Object.entries(config).map(async([appName, appConfig]) => {
      if (appConfig.type === "caddy") {
        const {
          artifactsPaths,
        } = appConfig;
        await pushArtifacts(artifactsPaths, appName, version, fullPath);
      }
    }));
  });

program.parse();