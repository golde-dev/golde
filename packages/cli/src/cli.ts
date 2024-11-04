import { load } from "@std/dotenv";
import { logger } from "./logger.ts";
import { Command } from "commander";
import { getConfig, getFinalConfig } from "./config.ts";
import { createPlan, hasChanges, printPlan } from "./plan.ts";
import { getFinalContext, initializeContext } from "./context.ts";
import { initConfig } from "./init.ts";
import { VERSION } from "./version.ts";
import {
  confirmExecutePlan,
  createOutput,
  executePlan,
  printChanges,
  updateState,
} from "./apply.ts";
import { verifyInstalled } from "./utils/git.ts";
import { getDependencies } from "./dependencies.ts";
import { lockDependencies, releaseLocks } from "./lock.ts";
import type { LevelName } from "@std/log";

// TODO: handel .env.example errors
await load({
  export: true,
});

await verifyInstalled();

const program = new Command();

program
  .name("golde")
  .description("Golde CLI")
  .version(VERSION);

program
  .command("init")
  .description("Initialize new golde project")
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
  .option("-f, --format", "config output format", "json")
  .option("-j, --json", "logging output as json")
  .action(
    async function (
      { logLevel, json, config, all }: {
        logLevel: LevelName;
        config: string;
        json: boolean;
        all: boolean;
        format: "json" | "yaml" | "toml";
      },
    ) {
      logger.configure(logLevel, json);

      const loadedConfig = await getConfig(config, all);
      const context = await initializeContext(loadedConfig);

      logger.info("Config", context.config);
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
      { logLevel, json, config }: {
        logLevel: LevelName;
        config: string;
        json: boolean;
      },
    ) {
      logger.configure(logLevel, json);

      const loadedConfig = await getConfig(config);
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
      { logLevel, json, config }: {
        logLevel: LevelName;
        config: string;
        json: boolean;
      },
    ) {
      logger.configure(logLevel, json);

      const loadedConfig = await getConfig(config);
      const context = await initializeContext(loadedConfig);

      const initialPlan = await createPlan(context);
      const dependencies = await getDependencies(context, initialPlan);

      getFinalConfig(loadedConfig, dependencies);

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
      { logLevel, json, config }: {
        logLevel: LevelName;
        config: string;
        json: boolean;
      },
    ) {
      logger.configure(logLevel, json);

      const loadedConfig = await getConfig(config);
      const context = await initializeContext(loadedConfig);

      const initialPlan = await createPlan(context);
      const dependencies = await getDependencies(context, initialPlan);

      const finalConfig = getFinalConfig(loadedConfig, dependencies);
      const finalContext = getFinalContext(context, finalConfig);

      const finalPlan = await createPlan(finalContext);
      if (!hasChanges(finalPlan)) {
        logger.info("No changes detected");
        return;
      }
      printPlan(finalPlan);
    },
  );

program
  .command("apply")
  .description("Apply changes required by the current configuration")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-y, --yes", "apply plan without prompting")
  .option("-j, --json", "log output as json")
  .action(
    async function (
      { logLevel, json, config, yes: autoConfirm }: {
        logLevel: LevelName;
        yes: boolean;
        config: string;
        json: boolean;
      },
    ) {
      logger.configure(logLevel, json);

      const initialConfig = await getConfig(config);
      const initialContext = await initializeContext(initialConfig, autoConfirm);
      const initialPlan = await createPlan(initialContext);
      const initialDependencies = await getDependencies(initialContext, initialPlan);

      if (!hasChanges(initialPlan)) {
        logger.info("No changes detected");
        return;
      }
      printPlan(initialPlan);

      const locks = await lockDependencies(initialContext, initialDependencies);
      const finalDependencies = await getDependencies(initialContext, initialPlan);
      const finalConfig = getFinalConfig(initialConfig, finalDependencies);
      const finalContext = getFinalContext(initialContext, finalConfig);
      const finalPlan = await createPlan(finalContext);

      const shouldExecute = autoConfirm || await confirmExecutePlan();

      if (shouldExecute) {
        const changes = await executePlan(finalPlan);
        printChanges(changes);

        const state = await updateState(finalContext, changes, locks);
        createOutput(finalConfig, state);
      }
      await releaseLocks(finalContext, locks);
    },
  );

program.parse();
