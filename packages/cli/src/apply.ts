import { Queue } from "moderndash";
import { removeEmpty } from "./utils/object.ts";
import { set } from "moderndash";
import { logger } from "./logger.ts";
import { Type } from "./types/plan.ts";
import type { Context } from "./types/context.ts";
import type { Changes, Plan } from "./types/plan.ts";
import type { CreateResult, DeleteResult, UpdateResult } from "./types/plan.ts";
import type { State } from "./types/state.ts";

export async function executePlan(plan: Plan): Promise<Changes[]> {
  logger.info("Start plan execution");
  try {
    const queue = new Queue(20);

    const result: Changes[] = await queue.add(
      plan
        .filter((unit) => unit.type !== Type.Noop)
        .map((unit) => async (): Promise<Changes> => {
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

    const changes = await result;
    logger.info("Successfully executed plan");
    return changes;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to execute plan: ${error.message}`);
    }
    return Deno.exit(1);
  }
}

/**
 * Given a state and changes, apply changes to state and return new state
 */
export function applyChanges(state: State = {}, changes: Changes[]): State {
  const newState = structuredClone(state);
  const emptyObject = {};

  for (const unit of changes) {
    const {
      type,
      path,
      state,
    } = unit;

    switch (type) {
      case Type.Update:
      case Type.Create:
        set(newState, path, state);
        break;
      case Type.Delete:
        set(newState, path, emptyObject);
        break;
      default:
        throw new Error("Unknown type");
    }
  }
  return removeEmpty(newState) as State;
}

export async function updateState(context: Context, changes: Changes[]): Promise<void> {
  const {
    state,
    config: {
      name,
    },
    git: {
      branchName,
    },
  } = context;

  await state.applyChanges(branchName, name, changes);
}

export function printResult(changes: Changes[]): void {
  for (const change of changes) {
    const {
      type,
      path,
    } = change;

    switch (type) {
      case Type.Update:
      case Type.Create:
        break;
      case Type.Delete:
        logger.info(`Deleted ${path}`);
        break;
      default:
        throw new Error("Unknown type");
    }
  }
}
