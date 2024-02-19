/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { Command } from "commander";
import { existsSync } from "fs";
import { config } from "dotenv";
import { pushArtifacts } from "../artifacts.js";
import type { Config } from "../types/config.js";
import { getCurrentHash } from "../git.js";
import logger from "../logger.js";
import { cwd } from "process";
import { join, resolve } from "path";
import { importDynamic, importTS } from "../utils/module.js";

const pwd = cwd();

config({path: join(pwd, ".env")});


const getConfig = async(): Promise<Config> => {
  if (existsSync(`${pwd}/deployer.config.cjs`)) {
    return require(`${pwd}/deployer.config.cjs`) as Config;
  }
  if (existsSync(`${pwd}/deployer.config.json`)) {
    return require(`${pwd}/deployer.config.json`) as Config;
  }
  if (existsSync(`${pwd}/deployer.config.js`)) {
    const {default: deployerConfig} = await importDynamic<{default: Config}>(`${pwd}/deployer.config.js`);
    return deployerConfig;
  }
  if (existsSync("./deployer.config.ts")) {
    const {default: deployerConfig} = await importTS<{default: Config}>(`${pwd}/deployer.config.ts`);
    return deployerConfig; 
  }
  logger.error("Missing config file");
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
    const deployerConfig = await getConfig();
    const version = getCurrentHash();
    const fullPath = resolve(path);
    
    await Promise.all(Object.entries(deployerConfig).map(async([appName, appConfig]) => {
      if (appConfig.type === "caddy") {
        const {
          artifactsPaths,
        } = appConfig;
        await pushArtifacts(artifactsPaths, appName, version, fullPath);
      }
    }));
  });

program.parse();