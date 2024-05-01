import { load } from "@std/dotenv";
import { logger } from "../logger.ts";
import { Command } from "commander";
import { getConfig } from "../config.ts";
import { createPlan } from "../plan.ts";
import { initializeContext } from "../context.ts";
import { initConfig } from "../init.ts";

await load({ export: true });

const program = new Command();

program
  .name("deployer")
  .description("CLI to manager deployer")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize new configuration")
  .option("-d, --debug", "enable debug mode")
  .action(async function ({ debug }: { debug: boolean }) {
    if (debug) {
      logger.setLevel("DEBUG");
    }
    await initConfig();
    logger.info("Config created");
  });

program
  .command("show")
  .description("Show configuration")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .action(
    async function (
      { debug, config: configPath }: { debug: boolean; config: string },
    ) {
      if (debug) {
        logger.setLevel("DEBUG");
      }
      const loadedConfig = await getConfig(configPath);

      const {
        nextConfig,
      } = await initializeContext(loadedConfig);

      logger.info("Config", nextConfig);
    },
  );

program
  .command("state")
  .description("Show current state")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .action(
    async function (
      { debug, config: configPath }: { debug: boolean; config: string },
    ) {
      if (debug) {
        logger.setLevel("DEBUG");
      }
      const loadedConfig = await getConfig(configPath);
      const {
        previousState,
      } = await initializeContext(loadedConfig);

      logger.info("Current state", previousState);
    },
  );

program
  .command("validate")
  .description("Check whether the configuration is valid")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .action(
    async function (
      { debug, config: configPath }: { debug: boolean; config: string },
    ) {
      if (debug) {
        logger.setLevel("DEBUG");
      }
      const loadedConfig = await getConfig(configPath);
      await initializeContext(loadedConfig);

      logger.info("Config is valid");
    },
  );

program
  .command("plan")
  .description("Plan changes required by the current configuration")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .option("-p, --prune", "remove branch based resources")
  .action(
    async function (
      { debug, config: configPath }: { debug: boolean; config: string },
    ) {
      if (debug) {
        logger.setLevel("DEBUG");
      }
      const loadedConfig = await getConfig(configPath);
      const context = await initializeContext(loadedConfig);
      const plan = await createPlan(context);

      logger.info("Execution plan", plan);
    },
  );

program
  .command("apply")
  .description("Apply changes required by the current configuration")
  .option("-d, --debug", "enable debug mode")
  .option("-c, --config", "location of config file")
  .option("-y, --yes", "apply plan without prompting")
  .option("-p, --prune", "remove branch based resources")
  .action(
    async function (
      { debug, config: configPath }: { debug: boolean; config: string },
    ) {
      if (debug) {
        logger.setLevel("DEBUG");
      }
      await getConfig(configPath);
    },
  );

program.parse();
