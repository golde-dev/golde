import { confirm } from "@inquirer/prompts";
import { logger } from "./logger.ts";
import { formatDuration } from "./utils/duration.ts";
import { Type } from "./types/plan.ts";
import { hasResolved, resolveUnitState } from "./utils/template.ts";
import type { Context } from "./types/context.ts";
import type {
  Change,
  ExecutionGroup,
  ExecutionPlan,
  Plan,
  UpdateVersionResult,
} from "./types/plan.ts";
import type { State } from "./types/state.ts";
import type { Lock } from "./types/lock.ts";
import type {
  ChangeVersionResult,
  CreateResult,
  CreateVersionResult,
  DeleteResult,
  DeleteVersionResult,
  UpdateResult,
} from "./types/plan.ts";
import { chunk, get } from "@es-toolkit/es-toolkit/compat";
import type { ResourceDependency } from "@/types/dependencies.ts";
import { sortByPath } from "@/plan.ts";
import { exit } from "node:process";

export async function confirmExecutePlan(): Promise<boolean> {
  try {
    return await confirm({
      message: `Do you want to execute plan?`,
      default: true,
    });
  } catch {
    return false;
  }
}

interface Execution {
  remainingPlan: ExecutionPlan;
  executionPlan: ExecutionPlan;
}
export function createExecutionPlan(
  initialPlan: ExecutionPlan,
  changes: Change[],
): Execution {
  const executionPlan: ExecutionPlan = [];
  const remainingPlan: ExecutionPlan = [];

  for (const unit of initialPlan) {
    if (unit.type === Type.ChangeVersion) {
      executionPlan.push(unit);
      continue;
    }

    const resolvedUnit = resolveUnitState(unit, changes);
    const allDepsResolved = resolvedUnit
      .args
      .every((arg: unknown) => hasResolved(arg));

    if (allDepsResolved) {
      executionPlan.push(resolvedUnit);
    } else {
      remainingPlan.push(resolvedUnit);
    }
  }

  return {
    executionPlan,
    remainingPlan,
  };
}

export function getInitialDependsOn(
  initialPlan: Plan,
  path: string,
  version?: string,
): ResourceDependency[] {
  const unit = version
    ? initialPlan.find((unit) => get(unit, "path") === path && get(unit, "version") === version)
    : initialPlan.find((unit) => get(unit, "path") === path);

  return get(unit, "dependsOn", []);
}

export async function executePlanRecursively(
  initialPlan: Plan,
  plan: ExecutionPlan,
  changes: Change[] = [],
): Promise<Change[]> {
  const { executionPlan, remainingPlan } = createExecutionPlan(plan, changes);

  if (executionPlan.length === 0) {
    if (remainingPlan.length === 0) {
      return changes;
    }
    logger.error("Failed to execute plan, unresolved dependencies", remainingPlan);
    throw new Error("Failed to execute plan, unresolved dependencies");
  }

  logger.info(
    `[Execute] Executing plan ${executionPlan.length} units`,
    executionPlan.map((unit) =>
      "version" in unit ? `${unit.path} version ${unit.version}` : `${unit.path}`
    ),
  );

  const chunks = chunk(executionPlan, 20);
  try {
    const chunksChanges: Change[] = [];
    for (const chunk of chunks) {
      const chunkChanges: Change[] = await Promise.all(
        chunk
          .map(async (unit): Promise<Change> => {
            if (unit.type === Type.Create) {
              const start = performance.now();
              const state = await unit.executor(...unit.args);
              const end = performance.now();
              const createTime = end - start;

              const create: CreateResult = {
                type: Type.Create,
                path: unit.path,
                state: {
                  ...state,
                  dependsOn: getInitialDependsOn(initialPlan, unit.path),
                },
                config: unit.config,
                executionTime: createTime,
              };
              return create;
            } else if (unit.type === Type.CreateVersion) {
              const start = performance.now();
              const state = await unit.executor(...unit.args);
              const end = performance.now();
              const createTime = end - start;
              const create: CreateVersionResult = {
                type: Type.CreateVersion,
                path: unit.path,
                version: unit.version,
                isCurrent: true,
                state: {
                  ...state,
                  dependsOn: getInitialDependsOn(initialPlan, unit.path, unit.version),
                },
                config: unit.config,
                executionTime: createTime,
              };
              return create;
            } else if (unit.type === Type.Update) {
              const start = performance.now();
              const state = await unit.executor(...unit.args);
              const end = performance.now();

              const updateTime = end - start;
              const update: UpdateResult = {
                type: Type.Update,
                path: unit.path,
                prevState: unit.state,
                state: {
                  ...state,
                  dependsOn: getInitialDependsOn(initialPlan, unit.path),
                },
                config: unit.config,
                executionTime: updateTime,
              };
              return update;
            } else if (unit.type === Type.UpdateVersion) {
              const start = performance.now();
              const state = await unit.executor(...unit.args);
              const end = performance.now();

              const updateTime = end - start;
              const update: UpdateVersionResult = {
                type: Type.UpdateVersion,
                path: unit.path,
                version: unit.version,
                isCurrent: true,
                prevState: unit.state,
                state: {
                  ...state,
                  dependsOn: getInitialDependsOn(initialPlan, unit.path, unit.version),
                },
                config: unit.config,
                executionTime: updateTime,
              };
              return update;
            } else if (unit.type === Type.Delete) {
              const start = performance.now();
              await unit.executor(...unit.args);
              const end = performance.now();
              const deleteTime = end - start;

              const deletes: DeleteResult = {
                type: Type.Delete,
                path: unit.path,
                state: unit.state,
                executionTime: deleteTime,
              };
              return deletes;
            } else if (unit.type === Type.DeleteVersion) {
              const start = performance.now();
              await unit.executor(...unit.args);
              const end = performance.now();
              const deleteTime = end - start;

              const deletesVersion: DeleteVersionResult = {
                type: Type.DeleteVersion,
                path: unit.path,
                version: unit.version,
                state: unit.state,
                executionTime: deleteTime,
              };
              return deletesVersion;
            } else if (unit.type === Type.ChangeVersion) {
              const changeVersionUnit: ChangeVersionResult = {
                type: Type.ChangeVersion,
                path: unit.path,
                version: unit.version,
                prevVersion: unit.prevVersion,
                isCurrent: true,
                state: {
                  ...unit.state,
                  dependsOn: getInitialDependsOn(initialPlan, unit.path, unit.version),
                },
                executionTime: 0,
              };
              return changeVersionUnit;
            } else {
              throw new Error("Unknown type");
            }
          }),
      );
      chunksChanges.push(...chunkChanges);
    }
    return executePlanRecursively(initialPlan, remainingPlan, changes.concat(...chunksChanges));
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[Execute] Failed to execute plan: ${error.message}`);
    }
    return exit(1);
  }
}

export async function executePlan(
  initialPlan: Plan,
  executionPlan: ExecutionPlan,
): Promise<Change[]> {
  logger.debug(`[Execute] Executing for ${executionPlan.length} units started`);

  const start = Date.now();
  const changes = await executePlanRecursively(
    initialPlan,
    executionPlan,
  );
  const end = Date.now();
  logger.debug(
    `[Execute] Executing for ${executionPlan.length} units finished in ${
      formatDuration(end - start)
    }`,
  );

  return changes;
}

export async function updateState(
  context: Context,
  changes: Change[],
  locks: Lock[],
): Promise<State> {
  try {
    logger.debug("[Apply] Updating state");
    const {
      state,
      config: {
        name,
      },
      git: {
        branchName,
      },
    } = context;
    const start = performance.now();
    const updatedState = await state.applyChanges(name, branchName, changes, locks);
    const end = performance.now();

    if (logger.level === "DEBUG") {
      logger.debug(`[Apply] Updated state in ${formatDuration(end - start)}`, {
        state: updatedState,
      });
    } else {
      logger.info(`[Apply] Updated state in ${formatDuration(end - start)}`);
    }
    return updatedState;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[Apply] Failed to update state: ${error.message}`);
    }
    exit(1);
  }
}

export function printChanges(changes: Change[]): void {
  const plan = Object.groupBy(changes, ({ type }) => type) as ExecutionGroup;

  logger.info("[Plan] Execution results");

  if (plan[Type.Create]?.length) {
    logger.info(`[Execution] ${plan[Type.Create].length} resources created`);
    sortByPath(plan[Type.Create]).forEach((create) => {
      if (logger.level === "DEBUG") {
        logger.debug(`    ${create.path}`, {
          state: create.state,
          executionTime: create.executionTime,
        });
      } else {
        logger.info(`   ${create.path}`);
      }
    });
  }

  if (plan[Type.CreateVersion]?.length) {
    logger.info(`[Execution] ${plan[Type.CreateVersion].length} resources versions created`);
    sortByPath(plan[Type.CreateVersion]).forEach((create) => {
      if (logger.level === "DEBUG") {
        logger.debug(`${create.path}`, {
          version: create.version,
          state: create.state,
          executionTime: create.executionTime,
        });
      } else {
        logger.info(`   ${create.path}`);
        logger.info(`   version::${create.version}`);
      }
    });
  }

  if (plan[Type.Delete]?.length) {
    logger.info(`[Execution] ${plan[Type.Delete].length} resources deleted`);
    sortByPath(plan[Type.Delete]).forEach((deleted) => {
      if (logger.level === "DEBUG") {
        logger.debug(`${deleted.path}`, {
          state: deleted.state,
          executionTime: deleted.executionTime,
        });
      } else {
        logger.info(`   ${deleted.path}`);
      }
    });
  }

  if (plan[Type.DeleteVersion]?.length) {
    logger.info(`[Execution] ${plan[Type.DeleteVersion].length} resources versions deleted`);
    sortByPath(plan[Type.DeleteVersion]).forEach((deleted) => {
      if (logger.level === "DEBUG") {
        logger.debug(`${deleted.path}`, {
          version: deleted.version,
          state: deleted.state,
          executionTime: deleted.executionTime,
        });
      } else {
        logger.info(`   ${deleted.path}`);
        logger.info(`   version::${deleted.version}`);
      }
    });
  }

  if (plan[Type.Update]?.length) {
    logger.info(`[Execution] ${plan[Type.Update].length} Resources updated`);
    sortByPath(plan[Type.Update]).forEach((update) => {
      if (logger.level === "DEBUG") {
        logger.debug(`    ${update.path}`, {
          config: update.config,
          state: update.state,
          executionTime: update.executionTime,
        });
      } else {
        logger.info(`   ${update.path}`);
      }
    });
  }

  if (plan[Type.UpdateVersion]?.length) {
    logger.info(`[Execution] ${plan[Type.UpdateVersion].length} Resources version updated`);
    sortByPath(plan[Type.UpdateVersion]).forEach((update) => {
      if (logger.level === "DEBUG") {
        logger.debug(`${update.path}`, {
          version: update.version,
          config: update.config,
          state: update.state,
          executionTime: update.executionTime,
        });
      } else {
        logger.info(`   ${update.path}`);
        logger.info(`   version::${update.version}`);
      }
    });
  }

  if (plan[Type.ChangeVersion]?.length) {
    logger.info(`[Execution] ${plan[Type.ChangeVersion].length} resources versions changed`);
    sortByPath(plan[Type.ChangeVersion]).forEach((update) => {
      if (logger.level === "DEBUG") {
        logger.debug(`${update.path}`, {
          prevVersion: update.prevVersion,
          newVersion: update.version,
          state: update.state,
          executionTime: update.executionTime,
        });
      } else {
        logger.info(`   ${update.path}`);
        logger.info(`   version::${update.version}`);
      }
    });
  }
}
