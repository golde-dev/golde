import { logger } from "../../logger.ts";
import { assertBranch } from "../../utils/resource.ts";
import { isEqual } from "@es-toolkit/es-toolkit";
import { Type } from "../../types/plan.ts";
import { omitUndefined } from "../../utils/object.ts";
import { d1DatabasePath } from "./path.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan } from "../../types/plan.ts";
import type { D1DatabaseConfig, D1DatabaseState, DatabaseConfig, DatabaseState } from "./types.ts";
import type { CreateDatabase, DeleteDatabase, Executors } from "./executor.ts";
import { findResourceDependencies } from "../../dependencies.ts";
import type { ResourceDependency } from "../../types/dependencies.ts";
import { PlanError } from "../../error.ts";
import { PlanErrorCode } from "../../error.ts";

function getCurrent(buckets: D1DatabaseState = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: DatabaseConfig;
      state: DatabaseState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(buckets)) {
    previous[d1DatabasePath(name)] = {
      name,
      config,
      state: {
        ...rest,
        config,
      },
    };
  }
  return previous;
}

function getNext(config: D1DatabaseConfig = {}) {
  const next: {
    [path: string]: {
      name: string;
      config: DatabaseConfig;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [name, database] of Object.entries(config)) {
    next[d1DatabasePath(name)] = {
      name,
      config: omitUndefined(database),
      dependsOn: findResourceDependencies(database),
    };
  }
  return next;
}

export async function createD1DatabasePlan(
  executors: Executors,
  state?: D1DatabaseState,
  config?: D1DatabaseConfig,
): Promise<Plan> {
  const {
    createDatabase,
    deleteDatabase,
    assertDatabaseExist,
    assertDatabaseNotExist,
  } = executors;
  logger.debug(
    "[AWS] Planning for d1 database changes",
    {
      state,
      config,
    },
  );
  const plan: Plan = [];

  const previous = getCurrent(state);
  const next = getNext(config);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { config, name, dependsOn } = next[key];

    assertBranch(config);
    await assertDatabaseNotExist(name);

    const createUnit: CreateUnit<DatabaseConfig, DatabaseState, CreateDatabase> = {
      type: Type.Create,
      executor: createDatabase,
      args: [name, config, dependsOn],
      path: key,
      config,
      dependsOn,
    };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));
  for (const key of deleting) {
    const { state, name } = previous[key];

    await assertDatabaseExist(name);

    const deleteUnit: DeleteUnit<DatabaseState, DeleteDatabase> = {
      type: Type.Delete,
      executor: deleteDatabase,
      args: [name],
      path: key,
      state,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextConfig } = next[key];
    const { config: previousConfig, state } = previous[key];

    const isSameBaseConfig = isEqual(nextConfig, previousConfig);
    if (isSameBaseConfig) {
      const noopUnit: NoopUnit<DatabaseConfig, DatabaseState> = {
        type: Type.Noop,
        path: key,
        config: previousConfig,
        state,
        dependsOn: state.dependsOn,
      };
      plan.push(noopUnit);
    } else {
      throw new PlanError(
        "It is not possible to update d1 database, create new and migrate data",
        PlanErrorCode.UNSUPPORTED_OPERATION,
      );
    }
  }

  return await Promise.resolve(plan);
}

export async function createD1DatabaseDestroyPlan(
  executors: Executors,
  state?: D1DatabaseState,
) {
  const {
    deleteDatabase,
    assertDatabaseExist,
  } = executors;

  const plan: Plan = [];
  logger.debug("[Cloudflare] Creating destroy D1 databases plan", {
    state,
  });

  const previous = getCurrent(state);
  for (const key of Object.keys(previous)) {
    const { state, name } = previous[key];

    await assertDatabaseExist(name);

    const deleteUnit: DeleteUnit<DatabaseState, DeleteDatabase> = {
      type: Type.Delete,
      executor: deleteDatabase,
      args: [name],
      path: key,
      state: state,
    };
    plan.push(deleteUnit);
  }

  return Promise.resolve(plan);
}
