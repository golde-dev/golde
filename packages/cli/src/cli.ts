import { loadEnvFile } from "node:process";
import { logger } from "./logger.ts";
import { Command } from "commander";
import { getConfig, printConfig } from "./config.ts";
import { getFinalContext, initializeContext } from "./context.ts";
import { initConfig } from "./init.ts";
import { VERSION } from "./version.ts";
import { confirmExecutePlan, executePlan, printChanges, updateState } from "./apply.ts";
import { getBranchName, verifyInstalled } from "./utils/git.ts";
import { getExternalResources } from "./dependencies.ts";
import { lockDependencies, releaseLocks } from "./lock.ts";
import { buildRunInfo, formatOutputs, persistOutputs, printOutputs, resolveOutputs } from "./output.ts";
import { dispatchHooks } from "./hooks/dispatch.ts";
import { applyChangeSet } from "./state/utils/apply.ts";
import { configure } from "./configure.ts";
import { initExecutionContext } from "./asyncStorage.ts";
import { exit } from "node:process";
import { existsSync } from "node:fs";
import {
  createDestroyPlan,
  createPlan,
  filterExecutionUnits,
  hasChanges,
  printPlan,
  validatePlan,
} from "./plan.ts";
import type { Level } from "pino";

if (existsSync(".env")) {
  loadEnvFile();
}

await verifyInstalled();

const program = new Command();

program.name("golde").description("Golde CLI").version(VERSION);

program
  .command("configure")
  .description("Configure Golde CLI")
  .option("-l, --logLevel <level>", "define log level", "info")
  .option("-j, --json", "log output as json")
  .action(
    async ({ logLevel, json }: { logLevel: Level; json: boolean }) => {
      logger.configure(logLevel, json);

      await configure();
      logger.info("Successfully configured Golde CLI");
      exit(0);
    },
  );

program
  .command("init")
  .description("Initialize new golde project")
  .option("-l, --logLevel <level>", "define log level", "info")
  .option("-j, --json", "log output as json")
  .action(
    async ({ logLevel, json }: { logLevel: Level; json: boolean }) => {
      logger.configure(logLevel, json);

      await initConfig();
      logger.info("Config created");
      exit(0);
    },
  );

program
  .command("show")
  .description("Show current configuration")
  .option("-l, --logLevel <level>", "define log level", "info")
  .option("-c, --config <config>", "location of config file")
  .option("-a, --all", "show full config, including all branches")
  .option("-f, --format", "config output format", "json")
  .option("-j, --json", "logging output as json")
  .action(
    async (options: {
      logLevel: Level;
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
      printOutputs(resolveOutputs(config.outputs, [
        ...(context.previousResources ?? []),
        ...external,
      ]));
      exit(0);
    },
  );

program
  .command("state")
  .description("Show current state")
  .option("-l, --logLevel <level>", "define log level", "info")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .action(
    async ({
      logLevel,
      json,
      config,
    }: {
      logLevel: Level;
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

      logger.info(previousState, `[State] Current state for ${branchName}`);
      exit(0);
    },
  );

program
  .command("output")
  .description("Show output values from the last apply")
  .argument("[name]", "print a single output value")
  .option("-l, --logLevel <level>", "define log level", "warn")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "print outputs as JSON")
  .action(
    async (
      name: string | undefined,
      {
        logLevel,
        json,
        config,
      }: {
        logLevel: Level;
        config: string;
        json: boolean;
      },
    ) => {
      logger.configure(logLevel, false);

      const branchName = getBranchName();
      const loadedConfig = await getConfig(branchName, config);
      const context = await initializeContext(branchName, loadedConfig);

      const outputs = await context.state.getOutputs(loadedConfig.name, branchName);

      if (name) {
        const value = outputs[name];
        if (value) {
          logger.error(`[Output] Unknown output: ${name}`);
          exit(1);
        }
        console.log(value);
      } else if (json) {
        console.log(JSON.stringify(outputs, null, 2));
      } else {
        for (const line of formatOutputs(outputs)) {
          console.log(line);
        }
      }
      exit(0);
    },
  );

program
  .command("validate")
  .description("Check whether the configuration is valid")
  .option("-l, --logLevel <level>", "define log level", "info")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .action(
    async ({
      logLevel,
      json,
      config,
    }: {
      logLevel: Level;
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
  .option("-l, --logLevel <level>", "define log level", "info")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .option("-y, --yes", "destroy without prompting")
  .option("-a, --all", "destroy all resources across all branches")
  .option(
    "--ignore-already-deleted",
    "skip errors when deleting resources that no longer exist",
  )
  .option(
    "--ignore-already-created",
    "skip errors when creating resources that already exist",
  )
  .action(
    async (options: {
      logLevel: Level;
      config: string;
      json: boolean;
      yes: boolean;
      all: boolean;
      ignoreAlreadyDeleted: boolean;
      ignoreAlreadyCreated: boolean;
    }) => {
      const {
        logLevel,
        json,
        config: configPath,
        yes,
        ignoreAlreadyDeleted = false,
        ignoreAlreadyCreated = false,
      } = options;
      logger.configure(logLevel, json);
      initExecutionContext({ ignoreAlreadyDeleted, ignoreAlreadyCreated });

      const branchName = getBranchName();
      const started = performance.now();

      const config = await getConfig(branchName, configPath);
      const context = await initializeContext(branchName, config, yes);

      const initialPlan = await createDestroyPlan(context);
      const external = await getExternalResources(context, initialPlan);

      const finalContext = await getFinalContext(context, external);
      const finalPlan = await createDestroyPlan(finalContext);

      validatePlan(finalPlan);
      printPlan(finalPlan);

      const previousResources = context.previousResources ?? [];

      const locks = await lockDependencies(context, finalPlan, external);
      const executionUnits = filterExecutionUnits(finalPlan);

      const shouldExecute = yes || (await confirmExecutePlan());

      if (shouldExecute) {
        try {
          const changes = await executePlan(initialPlan, executionUnits);
          printChanges(changes);

          await updateState(context, changes, locks);
          await persistOutputs(context, {});
          await dispatchHooks(
            context,
            ["destroy"],
            buildRunInfo("destroy", "success", started, changes),
            {},
            [...applyChangeSet(previousResources, changes), ...external],
          );
        } catch (error) {
          await dispatchHooks(
            context,
            ["failure"],
            buildRunInfo("destroy", "failure", started, [], error),
            {},
            [...previousResources, ...external],
          );
          await releaseLocks(context, locks);
          exit(1);
        }
      }
      await releaseLocks(context, locks);
      exit(0);
    },
  );

program
  .command("prune")
  .description("Search for deleted upstream branches and remove resources")
  .option("-l, --logLevel <level>", "define log level", "info")
  .option("-c, --config <config>", "location of config file")
  .option("-j, --json", "log output as json")
  .option("-y, --yes", "destroy without prompting")
  .action(
    (options: {
      logLevel: Level;
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
  .option("-l, --logLevel <level>", "define log level", "info")
  .option("-c, --config <config>", "location of config file")
  .action(
    async (options: {
      logLevel: Level;
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
  .option("-l, --logLevel <level>", "define log level", "info")
  .option("-c, --config <config>", "location of config file")
  .option("-y, --yes", "apply plan without prompting")
  .option("-j, --json", "log output as json")
  .option(
    "--ignore-already-deleted",
    "skip errors when deleting resources that no longer exist",
  )
  .option(
    "--ignore-already-created",
    "skip errors when creating resources that already exist",
  )
  .action(
    async (options: {
      logLevel: Level;
      yes: boolean;
      config: string;
      json: boolean;
      ignoreAlreadyDeleted: boolean;
      ignoreAlreadyCreated: boolean;
    }) => {
      const {
        logLevel,
        json,
        config: configPath,
        yes = false,
        ignoreAlreadyDeleted = false,
        ignoreAlreadyCreated = false,
      } = options;
      logger.configure(logLevel, json);
      initExecutionContext({ ignoreAlreadyDeleted, ignoreAlreadyCreated });

      const branchName = getBranchName();
      const started = performance.now();

      const config = await getConfig(branchName, configPath);
      const context = await initializeContext(branchName, config, yes);

      const initialPlan = await createPlan(context, { exitOnNoChanges: false });
      const external = await getExternalResources(context, initialPlan);

      const finalContext = await getFinalContext(context, external);
      const finalPlan = await createPlan(finalContext, { exitOnNoChanges: false });

      validatePlan(finalPlan);
      printPlan(finalPlan);

      const previousResources = context.previousResources ?? [];

      if (!hasChanges(finalPlan)) {
        const resources = [...previousResources, ...external];
        const outputs = resolveOutputs(context.config.outputs, resources);
        printOutputs(outputs);
        await persistOutputs(context, outputs);
        await dispatchHooks(
          context,
          ["unchanged"],
          buildRunInfo("apply", "success", started, []),
          outputs,
          resources,
        );
        exit(0);
      }

      const locks = await lockDependencies(context, finalPlan, external);
      const executionUnits = filterExecutionUnits(finalPlan);

      const shouldExecute = yes || (await confirmExecutePlan());

      if (shouldExecute) {
        try {
          const changes = await executePlan(initialPlan, executionUnits);
          printChanges(changes);

          await updateState(context, changes, locks);

          const resources = [...applyChangeSet(previousResources, changes), ...external];
          const outputs = resolveOutputs(context.config.outputs, resources);
          printOutputs(outputs);
          await persistOutputs(context, outputs);
          await dispatchHooks(
            context,
            ["success", "changed"],
            buildRunInfo("apply", "success", started, changes),
            outputs,
            resources,
          );
        } catch (error) {
          await dispatchHooks(
            context,
            ["failure"],
            buildRunInfo("apply", "failure", started, [], error),
            {},
            [...previousResources, ...external],
          );
          await releaseLocks(context, locks);
          exit(1);
        }
      }
      await releaseLocks(context, locks);
      exit(0);
    },
  );

program.parse();
