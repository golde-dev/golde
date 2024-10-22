import { load } from "@std/dotenv";
import { logger } from "../logger.ts";
import { Command } from "commander";
import { getConfig } from "../config.ts";
import { createPlan } from "../plan.ts";
import { initializeContext } from "../context.ts";
import { initConfig } from "../init.ts";
import type { LevelName } from "@std/log";
import { VERSION } from "../version.ts";
import { applyPlan } from "../apply.ts";
import { verifyInstalled } from "../clients/git.ts";

// TODO: handel .env.example errors
await load({ 
  export: true 
});

await verifyInstalled();

const program = new Command();

program
  .name("golde")
  .description("CLI to golde")
  .version(VERSION);

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
  .description("Show current configuration")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-a, --all", "show full config, including all branches")
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
        config,
      } = await initializeContext(loadedConfig);

      logger.info("Config", config);
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

      const loadedConfig = await getConfig(configPath);
      const context = await initializeContext(loadedConfig);
      const plan = await createPlan(context);

      await applyPlan(context, plan);
    },
  );

program.parse();
