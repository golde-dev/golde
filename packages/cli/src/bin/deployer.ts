/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { Command } from "commander";
import { config } from "dotenv";
import logger from "../logger.js";
import { cwd } from "process";
import { join } from "path";
import { getAndValidateContext } from "../commands/config.js";

config({ path: join(cwd(), ".env") });

const program = new Command();

program
  .name("deployer")
  .description("CLI to manager deployer")
  .version("0.8.0");

program
  .command("validate")
  .description("validate deployer config")
  .option("-d, --debug", "enable debug mode")
  .action(async function({ debug }: { debug: boolean }) {
    if (debug) {
      logger.level = "debug";
    }

    await getAndValidateContext();
  });

// program
//   .command("push")
//   .description("push artifacts and config")
//   .option("-d, --debug", "enable debug mode")
//   .option("-p, --path <path>", "path for build artifacts", "/tmp")
//   .action(async function({ debug, path }: { debug: boolean, path: string }) {
//     if (debug) {
//       logger.level = "debug";
//     }
//     const deployerConfig = await getConfig();


//     const version = getCurrentHash();
//     const fullPath = resolve(path);

//     await Promise.all(Object.entries(deployerConfig).map(async([appName, appConfig]) => {
//       if (appConfig.type === "caddy") {
//         const {
//           artifactsPaths,
//         } = appConfig;
//         await pushArtifacts(artifactsPaths, appName, version, fullPath);
//       }
//     }));
//   });

program.parse();