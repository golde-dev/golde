import logger from "../logger.js";
import { Command } from "commander";
import { config } from "dotenv";
import { cwd } from "process";
import { join } from "path";
import { getConfig } from "../config.js";
import { version } from "../../package.json";
import { planChanges } from "../plan.js";
import { initializeContext } from "../context.js";

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
  .action(async function({ debug, config: configPath }: { debug: boolean, config: string }) {
    if (debug) {
      logger.level = "debug";
    }
    const loadedConfig = await getConfig(configPath);

    const {
      nextConfig,
    } = await initializeContext(loadedConfig);

    logger.info(nextConfig, "Config");
  });

program
  .command("state")
  .description("Show current state")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .action(async function({ debug, config: configPath }: { debug: boolean, config: string }) {
    if (debug) {
      logger.level = "debug";
    }
    const loadedConfig = await getConfig(configPath);
    const {
      previousState,
    } = await initializeContext(loadedConfig);

    logger.info(previousState, "Current state");
  });


program
  .command("validate")
  .description("Check whether the configuration is valid")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .action(async function({ debug, config: configPath }: { debug: boolean, config: string }) {
    if (debug) {
      logger.level = "debug";
    }
    const loadedConfig = await getConfig(configPath);
    await initializeContext(loadedConfig);

    logger.info("Config is valid");
  });


program
  .command("plan")
  .description("Plan changes required by the current configuration")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .action(async function({ debug, config: configPath }: { debug: boolean, config: string }) {
    if (debug) {
      logger.level = "debug";
    }
    const loadedConfig = await getConfig(configPath);
    const context = await initializeContext(loadedConfig);
    const plan = await planChanges(context);

    logger.info(plan, "Execution plan");
  });

program
  .command("apply")
  .description("Apply changes required by the current configuration")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .option("-y, --yes", "apply plan without prompting")
  .action(async function({ debug, config: configPath }: { debug: boolean, config: string }) {
    if (debug) {
      logger.level = "debug";
    }
    await getConfig(configPath);
  });


program.parse();