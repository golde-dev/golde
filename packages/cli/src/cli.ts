import { loadEnvFile } from "node:process";
import { logger } from "./logger.ts";
import { Command } from "commander";
import { getConfig, printConfig } from "./config.ts";
import {
  createDestroyPlan,
  createPlan,
  filterExecutionUnits,
  printPlan,
  validatePlan,
} from "./plan.ts";
import { getFinalContext, initializeContext } from "./context.ts";
import { initConfig } from "./init.ts";
import { VERSION } from "./version.ts";
import { confirmExecutePlan, executePlan, printChanges, updateState } from "./apply.ts";
import { getBranchName, verifyInstalled } from "./utils/git.ts";
import { getExternalResources } from "./dependencies.ts";
import { lockDependencies, releaseLocks } from "./lock.ts";
import { createOutputs } from "./output.ts";
import { configure } from "./configure.ts";
import { exit } from "node:process";
import type { LevelName } from "@std/log";

loadEnvFile();

await verifyInstalled();

const program = new Command();

program.name("golde").description("Golde CLI").version(VERSION);

program
  .command("configure")
  .description("Configure Golde CLI")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-j, --json", "log output as json")
  .action(
    async ({ logLevel, json }: { logLevel: LevelName; json: boolean }) => {
      logger.configure(logLevel, json);

      await configure();
      logger.info("Successfully configured Golde CLI");
      exit(0);
    },
  );

program
  .command("init")
  .description("Initialize new golde project")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-j, --json", "log output as json")
  .action(
    async ({ logLevel, json }: { logLevel: LevelName; json: boolean }) => {
      logger.configure(logLevel, json);

      await initConfig();
      logger.info("Config created");
      exit(0);
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
    async (options: {
      logLevel: LevelName;
      config: string;
      json: boolean;
      format: "json" | "yaml" | "toml";
    }) => {
      const { logLevel, json, config: configPath } = options;

      logger.configure(logLevel, json);
      const branchName = getBranchName();
      const config = await getConfig(branchName, configPath);
      const context = await initializeContext(branchName, config);

      const initialPlan = await createPlan(context);
      const external = await getExternalResources(context, initialPlan);

      const { config: finalConfig } = await getFinalContext(context, external);

      logger.info(`[Config] current config for ${branchName}`);
      printConfig(finalConfig);
      exit(0);
    },
  );

program
  .command("state")
  .description("Show current state")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .action(
    async ({
      logLevel,
      json,
      config,
    }: {
      logLevel: LevelName;
      config: string;
      json: boolean;
    }) => {
      logger.configure(logLevel, json);

      const branchName = getBranchName();
      const loadedConfig = await getConfig(branchName, config);
      const { previousState } = await initializeContext(
        branchName,
        loadedConfig,
      );

      logger.info(`[State] Current state for ${branchName}`, previousState);
      exit(0);
    },
  );

program
  .command("validate")
  .description("Check whether the configuration is valid")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .action(
    async ({
      logLevel,
      json,
      config,
    }: {
      logLevel: LevelName;
      config: string;
      json: boolean;
    }) => {
      logger.configure(logLevel, json);

      const branchName = getBranchName();
      const loadedConfig = await getConfig(branchName, config);
      const context = await initializeContext(branchName, loadedConfig);

      const plan = await createPlan(context);

      await getExternalResources(context, plan);

      logger.info("Config is valid");
      exit(0);
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
    async (options: {
      logLevel: LevelName;
      config: string;
      json: boolean;
      yes: boolean;
      all: boolean;
    }) => {
      const { logLevel, json, config: configPath, yes } = options;
      logger.configure(logLevel, json);

      const branchName = getBranchName();

      const config = await getConfig(branchName, configPath);
      const context = await initializeContext(branchName, config, yes);

      const initialPlan = await createDestroyPlan(context);
      const external = await getExternalResources(context, initialPlan);

      const finalContext = await getFinalContext(context, external);
      const finalPlan = await createDestroyPlan(finalContext);

      validatePlan(finalPlan);
      printPlan(finalPlan);

      const locks = await lockDependencies(context, finalPlan, external);
      const executionUnits = filterExecutionUnits(finalPlan);

      const shouldExecute = yes || (await confirmExecutePlan());

      if (shouldExecute) {
        const changes = await executePlan(initialPlan, executionUnits);
        printChanges(changes);

        const state = await updateState(context, changes, locks);
        createOutputs(context, state);
      }
      await releaseLocks(context, locks);
      exit(0);
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
    (options: {
      logLevel: LevelName;
      config: string;
      json: boolean;
      yes: boolean;
    }) => {
      const { logLevel, json, config: _, yes: __ } = options;
      logger.configure(logLevel, json);
      logger.warn("This command is not implemented yet");
      exit(0);
    },
  );

program
  .command("plan")
  .description("Plan changes required by the current configuration")
  .option("-l, --logLevel <level>", "define log level", "INFO")
  .option("-c, --config <config>", "location of config file")
  .action(
    async (options: {
      logLevel: LevelName;
      config: string;
      json: boolean;
    }) => {
      const { logLevel, json, config } = options;
      logger.configure(logLevel, json);

      const branchName = getBranchName();
      const loadedConfig = await getConfig(branchName, config);
      const context = await initializeContext(branchName, loadedConfig);
      const initialPlan = await createPlan(context);
      const external = await getExternalResources(context, initialPlan);
      const finalContext = await getFinalContext(context, external);
      const finalPlan = await createPlan(finalContext);

      validatePlan(finalPlan);
      printPlan(finalPlan);

      exit(0);
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
    async (options: {
      logLevel: LevelName;
      yes: boolean;
      config: string;
      json: boolean;
    }) => {
      const { logLevel, json, config: configPath, yes = false } = options;
      logger.configure(logLevel, json);

      const branchName = getBranchName();

      const config = await getConfig(branchName, configPath);
      const context = await initializeContext(branchName, config, yes);

      const initialPlan = await createPlan(context);
      const external = await getExternalResources(context, initialPlan);

      const finalContext = await getFinalContext(context, external);
      const finalPlan = await createPlan(finalContext);

      validatePlan(finalPlan);
      printPlan(finalPlan);

      const locks = await lockDependencies(context, finalPlan, external);
      const executionUnits = filterExecutionUnits(finalPlan);

      const shouldExecute = yes || (await confirmExecutePlan());

      if (shouldExecute) {
        const changes = await executePlan(initialPlan, executionUnits);
        printChanges(changes);

        const state = await updateState(context, changes, locks);
        createOutputs(context, state);
      }
      await releaseLocks(context, locks);
      exit(0);
    },
  );

program.parse();
