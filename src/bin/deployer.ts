import { Command } from "commander";
import { existsSync } from "fs";
import { join } from "path";
import { pushArtifacts } from "../artifacts.js";
import type { NewDeployConfig } from "../types/config.js";

const cwd = process.cwd();

const {default: config} = existsSync("./deployer.config.ts") 
  ? await import(join(cwd, "./deployer.config.ts")) as {default: NewDeployConfig}
  : await import(join(cwd, "./deployer.config.js")) as {default: NewDeployConfig};

const program = new Command();

const { 
  artifactsPaths, 
} = config;

program
  .name("deployer")
  .description("CLI to manager deployer")
  .version("0.8.0");

program
  .command("push")
  .description("push artifacts and config")
  .action(async() => {
    await pushArtifacts(artifactsPaths);
  });

program.parse();