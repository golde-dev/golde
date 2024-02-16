import { Command } from "commander";
import { existsSync } from "fs";
import { join } from "path";
import { pushArtifacts } from "../artifacts.js";
import type { Config } from "../types/config.js";

const cwd = process.cwd();

const getConfig = async() => {
  const {default: config} = existsSync("./deployer.config.ts") 
  ? await import(join(cwd, "./deployer.config.ts")) as {default: Config}
  : await import(join(cwd, "./deployer.config.js")) as {default: Config};
  return config;
};

const program = new Command();

program
  .name("deployer")
  .description("CLI to manager deployer")
  .version("0.8.0");

program
  .command("push")
  .description("push artifacts and config")
  .action(async() => {
    const config = await getConfig();
    await Promise.all(Object.entries(config).map(async([appName, appConfig]) => {
      const {
        artifactsPaths,
      } = appConfig;
      await pushArtifacts(artifactsPaths, appName);
    }));
  });

program.parse();