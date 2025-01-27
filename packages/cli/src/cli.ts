import { load } from "@std/dotenv";
import { logger } from "./logger.ts";
import { Command } from "commander";
import { getConfig, getFinalConfig } from "./config.ts";
import { createDestroyPlan, createPlan } from "./plan.ts";
import { getFinalContext, initializeContext } from "./context.ts";
import { initConfig } from "./init.ts";
import { VERSION } from "./version.ts";
import { confirmExecutePlan, executePlan, printChanges, updateState } from "./apply.ts";
import { getBranchName, verifyInstalled } from "./utils/git.ts";
import { getDependencies } from "./dependencies.ts";
import { lockDependencies, releaseLocks } from "./lock.ts";
import type { LevelName } from "@std/log";
import { createOutput } from "./output.ts";
import { configure } from "./configure.ts";

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
  .command("configure")
  .description("Configure Golde CLI")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-j, --json", "log output as json")
  .action(
    async function (
      { logLevel, json }: { logLevel: LevelName; json: boolean },
    ) {
      logger.configure(logLevel, json);

      await configure();
      logger.info("Successfully configured Golde CLI")
      Deno.exit(0)
    },
  );

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
      Deno.exit(0)
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
      options: {
        logLevel: LevelName;
        config: string;
        json: boolean;
        format: "json" | "yaml" | "toml";
      },
    ) {
      const {
        logLevel,
        json,
        config,
      } = options;

      logger.configure(logLevel, json);
      const branchName = getBranchName();
      const loadedConfig = await getConfig(branchName, config);
      const context = await initializeContext(branchName, loadedConfig);

      logger.info("Config", context.config);
      Deno.exit(0);
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

      const branchName = getBranchName();
      const loadedConfig = await getConfig(branchName, config);
      const {
        previousState,
      } = await initializeContext(branchName, loadedConfig);

      logger.info("Current state", previousState);
      Deno.exit(0)
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

      const branchName = getBranchName();
      const loadedConfig = await getConfig(branchName, config);
      const context = await initializeContext(branchName, loadedConfig);

      const initialPlan = await createPlan(context);
      const dependencies = await getDependencies(context, initialPlan);

      getFinalConfig(loadedConfig, dependencies);

      logger.info("Config is valid");
      Deno.exit(0)
    },
  );

program
  .command("destroy")
  .description("Destroy current resources")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .option("-y, --yes", "destroy without prompting")
  .option("-a, --all", "destroy all resources across all branches")
  .action(
    async function (
      options: {
        logLevel: LevelName;
        config: string;
        json: boolean;
        yes: boolean;
        all: boolean;
      },
    ) {
      const {
        logLevel,
        json,
        config,
        yes,
      } = options;
      logger.configure(logLevel, json);

      const branchName = getBranchName();

      const loadedConfig = await getConfig(branchName, config);
      const context = await initializeContext(branchName, loadedConfig, yes);

      const _destroyPlan = await createDestroyPlan(context);
      Deno.exit(0)
    },
  );

program
  .command("prune")
  .description("Search for deleted upstream branches and remove resources")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .option("-y, --yes", "destroy without prompting")
  .action(
    function (
      options: {
        logLevel: LevelName;
        config: string;
        json: boolean;
        yes: boolean;
      },
    ) {
      const {
        logLevel,
        json,
        config: _,
        yes: __,
      } = options;
      logger.configure(logLevel, json);
      logger.warn("This command is not implemented yet");
      Deno.exit(0)
    },
  );

program
  .command("plan")
  .description("Plan changes required by the current configuration")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .action(
    async function (
      options: {
        logLevel: LevelName;
        config: string;
        json: boolean;
      },
    ) {
      const {
        logLevel,
        json,
        config,
      } = options;
      logger.configure(logLevel, json);

      const branchName = getBranchName();
      const loadedConfig = await getConfig(branchName, config);
      const context = await initializeContext(branchName, loadedConfig);

      const initialPlan = await createPlan(context, false);
      const dependencies = await getDependencies(context, initialPlan);

      const finalConfig = getFinalConfig(loadedConfig, dependencies);
      const finalContext = getFinalContext(context, finalConfig);

      await createPlan(finalContext, true);
      Deno.exit(0)
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
      options: {
        logLevel: LevelName;
        yes: boolean;
        config: string;
        json: boolean;
      },
    ) {
      const {
        logLevel,
        json,
        config,
        yes,
      } = options;
      logger.configure(logLevel, json);

      const branchName = getBranchName();

      const initialConfig = await getConfig(branchName, config);
      const initialContext = await initializeContext(branchName, initialConfig, yes);
      const initialPlan = await createPlan(initialContext, false);
      const initialDependencies = await getDependencies(initialContext, initialPlan, false);

      const locks = await lockDependencies(initialContext, initialDependencies);
      const finalDependencies = await getDependencies(initialContext, initialPlan, true);
      const finalConfig = getFinalConfig(initialConfig, finalDependencies);
      const finalContext = getFinalContext(initialContext, finalConfig);
      const finalPlan = await createPlan(finalContext, true);

      const shouldExecute = yes || await confirmExecutePlan();

      if (shouldExecute) {
        const changes = await executePlan(finalPlan);
        printChanges(changes);

        const state = await updateState(finalContext, changes, locks);
        createOutput(finalContext, state);
      }
      await releaseLocks(finalContext, locks);
      Deno.exit(0)
    },
  );

program.parse();
