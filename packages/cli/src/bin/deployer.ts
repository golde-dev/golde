import logger from "../logger.js";
import { Command } from "commander";
import { config } from "dotenv";
import { cwd } from "process";
import { join } from "path";
import { getAndValidateContext } from "../config.js";
import { version } from "../../package.json";

config({ path: join(cwd(), ".env") });

const program = new Command();

program
  .name("deployer")
  .description("CLI to manager deployer")
  .version(version);

  program
  .command("show")
  .description("Show configuration")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .action(async function({ debug, config }: { debug: boolean, config: string }) {
    if (debug) {
      logger.level = "debug";
    }
    const { 
      currentConfig, 
    } = await getAndValidateContext(config);

    logger.info(currentConfig);
  });

  program
  .command("state")
  .description("Show current state")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .action(async function({ debug, config }: { debug: boolean, config: string }) {
    if (debug) {
      logger.level = "debug";
    }
    const { 
      currentConfig, 
    } = await getAndValidateContext(config);

    logger.info(currentConfig);
  });


program
  .command("validate")
  .description("Check whether the configuration is valid")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .action(async function({ debug, config }: { debug: boolean, config: string }) {
    if (debug) {
      logger.level = "debug";
    }
    await getAndValidateContext(config);

    logger.info("Config is valid");
  });


  program
  .command("plan")
  .description("Show changes required by the current configuration")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .action(async function({ debug, config }: { debug: boolean, config: string }) {
    if (debug) {
      logger.level = "debug";
    }
    await getAndValidateContext(config);
    
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