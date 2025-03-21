import { Queue } from "moderndash";
import { confirm } from "@inquirer/prompts";
import { logger } from "./logger.ts";
import { formatDuration } from "./utils/duration.ts";
import { Type } from "./types/plan.ts";
import { hasResolved, resolveUnitState } from "./utils/template.ts";
import type { Context } from "./types/context.ts";
import type { Change, ExecutionPlan, Plan, UpdateVersionResult } from "./types/plan.ts";
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
import { get } from "@es-toolkit/es-toolkit/compat";
import type { ResourceDependency } from "@/types/dependencies.ts";

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

export async function executePlan(
  initialPlan: Plan,
  plan: ExecutionPlan,
  changes: Change[] = [],
): Promise<Change[]> {
  if (changes.length === 0) {
    logger.info(`[Execute] Executing for ${plan.length} units started`);
  }

  const { executionPlan, remainingPlan } = createExecutionPlan(plan, changes);
  if (executionPlan.length === 0) {
    logger.info(`[Execute] Executing plan finished`);
    return changes;
  }

  logger.info(
    `[Execute] Executing plan ${executionPlan.length} units`,
    executionPlan.map((unit) =>
      "version" in unit ? `${unit.path} version ${unit.version}` : `${unit.path}`
    ),
  );

  try {
    const queue = new Queue(20);
    const start = performance.now();
    const newChanges: Change[] = await queue.add(
      executionPlan
        .map((unit) => async (): Promise<Change> => {
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
    const end = performance.now();
    logger.info(`[Execute] Successfully executed plan in ${formatDuration(end - start)}`);

    return executePlan(initialPlan, remainingPlan, changes.concat(...newChanges));
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[Execute] Failed to execute plan: ${error.message}`);
    }
    return Deno.exit(1);
  }
}

export async function updateState(
  context: Context,
  changes: Change[],
  locks: Lock[],
): Promise<State> {
  try {
    logger.info("[Apply] Updating state");
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
    Deno.exit(1);
  }
}

export function printChanges(changes: Change[]): void {
  for (const change of changes) {
    const {
      type,
      path,
      executionTime,
    } = change;

    switch (type) {
      case Type.Update:
        logger.info(`[Execute] Updated ${path} in ${executionTime}ms`);
        break;
      case Type.UpdateVersion: {
        const { version } = change;
        logger.info(`[Execute] Updated version ${version} for ${path} in ${executionTime}ms`);
        break;
      }
      case Type.Create:
        logger.info(`[Execute] Created ${path} in ${executionTime}ms`);
        break;
      case Type.CreateVersion: {
        const { version } = change;
        logger.info(`[Execute] Created version ${version} for ${path} in ${executionTime}ms`);
        break;
      }
      case Type.Delete:
        logger.info(`[Execute] Deleted ${path} in ${executionTime}ms`);
        break;
      case Type.DeleteVersion: {
        const { version } = change;
        logger.info(`[Execute] Deleted version ${version} for ${path} in ${executionTime}ms`);
        break;
      }
      case Type.ChangeVersion: {
        const { version } = change;
        logger.info(`[Execute] Changed version ${version} for ${path}`);
        break;
      }
      default:
        throw new Error("Unknown type");
    }
  }
}
