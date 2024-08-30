import { load } from "@std/dotenv";
import { logger } from "../logger.ts";
import { Command } from "commander";
import { getConfig } from "../config.ts";
import { createPlan } from "../plan.ts";
import { initializeContext } from "../context.ts";
import { initConfig } from "../init.ts";
import { LevelName } from "@std/log";

await load({ export: true });

const program = new Command();

program
  .name("golde")
  .description("CLI to golde")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize new configuration")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-j, --json", "log output as json")
  .action(
    async function (
      { logLevel, json }: { logLevel: LevelName; json: boolean },
    ) {
      logger.configure(logLevel, json);

      await initConfig();
      logger.info("Config created");
    },
  );

program
  .command("show")
  .description("Show configuration")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .action(
    async function (
      { logLevel, json, config: configPath }: {
        logLevel: LevelName;
        config: string;
        json: boolean;
      },
    ) {
      logger.configure(logLevel, json);

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
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .action(
    async function (
      { logLevel, json, config: configPath }: {
        logLevel: LevelName;
        config: string;
        json: boolean;
      },
    ) {
      logger.configure(logLevel, json);

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
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .action(
    async function (
      { logLevel, json, config: configPath }: {
        logLevel: LevelName;
        config: string;
        json: boolean;
      },
    ) {
      logger.configure(logLevel, json);

      const loadedConfig = await getConfig(configPath);
      await initializeContext(loadedConfig);

      logger.info("Config is valid");
    },
  );

program
  .command("plan")
  .description("Plan changes required by the current configuration")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .option("-p, --prune", "remove branch based resources")
  .action(
    async function (
      { logLevel, json, config: configPath }: {
        logLevel: LevelName;
        config: string;
        json: boolean;
      },
    ) {
      logger.configure(logLevel, json);

      const loadedConfig = await getConfig(configPath);
      const context = await initializeContext(loadedConfig);
      const plan = await createPlan(context);

      logger.info("Execution plan", plan);
    },
  );

program
  .command("apply")
  .description("Apply changes required by the current configuration")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-y, --yes", "apply plan without prompting")
  .option("-j, --json", "log output as json")
  .option("-p, --prune", "remove branch based resources")
  .action(
    async function (
      { logLevel, json, config: configPath }: {
        logLevel: LevelName;
        config: string;
        json: boolean;
      },
    ) {
      logger.configure(logLevel, json);

      await getConfig(configPath);
    },
  );

program.parse();
