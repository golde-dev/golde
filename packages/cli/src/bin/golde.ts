import { load } from "@std/dotenv";
import { logger } from "../logger.ts";
import { Command } from "commander";
import { getConfig, getFinalConfig } from "../config.ts";
import { createPlan, printPlan } from "../plan.ts";
import { getFinalContext, initializeContext } from "../context.ts";
import { initConfig } from "../init.ts";
import type { LevelName } from "@std/log";
import { VERSION } from "../version.ts";
import { applyPlan } from "../apply.ts";
import { verifyInstalled } from "../clients/git.ts";
import { getDependencies } from "../dependacies.ts";
import { lockDependencies } from "../lock.ts";

// TODO: handel .env.example errors
await load({
  export: true,
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
      { logLevel, json, config: configPath, all }: {
        logLevel: LevelName;
        config: string;
        json: boolean;
        all: boolean;
      },
    ) {
      logger.configure(logLevel, json);

      const loadedConfig = await getConfig(configPath, all);
      const { config } = await initializeContext(loadedConfig);

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
      printPlan(plan);
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

      const initialPlan = await createPlan(context);
      const initialDependencies = await getDependencies(context, initialPlan);
      const locks = await lockDependencies(context, initialDependencies);
      const dependencies = await getDependencies(context, initialPlan);
      
      const finalConfig = getFinalConfig(loadedConfig, dependencies);
      const finalContext = getFinalContext(context, finalConfig);

      const finalPlan = await createPlan(finalContext);
      printPlan(finalPlan);
      const result = await applyPlan(context, finalPlan);
      printResult(result);

      await saveState(context, result);
      await releaseLocks(context, locks);
    },
  );

program.parse();
