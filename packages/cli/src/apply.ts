import { Queue } from "moderndash";
import { confirm } from "@inquirer/prompts";
import { logger } from "./logger.ts";
import { Type } from "./types/plan.ts";
import type { Context } from "./types/context.ts";
import type { Change, Plan } from "./types/plan.ts";
import type { CreateResult, DeleteResult, UpdateResult } from "./types/plan.ts";
import type { State } from "./types/state.ts";
import type { Lock } from "./types/lock.ts";
import { formatDuration } from "./utils/duration.ts";

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

export async function executePlan(plan: Plan): Promise<Change[]> {
  logger.info("[Execute] Start plan execution");

  try {
    const queue = new Queue(20);
    const start = performance.now();
    const changes: Change[] = await queue.add(
      plan
        .filter((unit) => unit.type !== Type.Noop)
        .map((unit) => async (): Promise<Change> => {
          if (unit.type === Type.Create) {
            const start = performance.now();
            const state = await unit.executor(...unit.args);
            const end = performance.now();
            const createTime = end - start;

            const create: CreateResult = {
              type: Type.Create,
              path: unit.path,
              state: state,
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
              state: state,
              config: unit.config,
              executionTime: updateTime,
            };
            return update;
          } else {
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
          }
        }),
    );
    const end = performance.now();
    logger.info(`[Execute] Successfully executed plan in ${formatDuration(end - start)}`);
    return changes;
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
        state: updateState,
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
      case Type.Create:
        logger.info(`[Execute] Created ${path} in ${executionTime}ms`);
        break;
      case Type.Delete:
        logger.info(`[Execute] Deleted ${path} in ${executionTime}ms`);
        break;

      default:
        throw new Error("Unknown type");
    }
  }
}
