import { Queue } from "moderndash";
import type { Context } from "./types/context.ts";
import type { Changes, Plan } from "./types/plan.ts";
import type { CreateResult } from "./types/plan.ts";
import type { UpdateResult } from "./types/plan.ts";
import { Type } from "./types/plan.ts";
import type { DeleteResult } from "./types/plan.ts";
import type { State } from "./mod.ts";
import { removeEmpty } from "./utils/object.ts";
import { set } from "moderndash";

export async function updateState(context: Context, result: Changes[]): Promise<void> {
  const {
    state,
    config: {
      name,
    },
    git: {
      branchName,
    },
  } = context;

  await state.applyChanges(branchName, name, result);
}

export async function printResult(_result: Changes[]): Promise<void> {
}

export async function executePlan(plan: Plan): Promise<Changes[]> {
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

  return await result;
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
