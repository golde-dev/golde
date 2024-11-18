import { logger } from "../../logger.ts";
import { mergeProjectTags } from "../../utils/tags.ts";
import type { Tags } from "../../types/config.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan, UpdateUnit } from "../../types/plan.ts";
import type {
  FunctionConfig,
  FunctionConfigState,
  FunctionState,
  LambdaFunctionConfig,
  LambdaFunctionState,
} from "./types.ts";
import { assertBranch } from "../../utils/resource.ts";
import { Type } from "../../types/plan.ts";
import { addDefaultRegion, assertRegion } from "../utils.ts";
import { isLambdaConfigEqual } from "./executor.ts";
import { omitUndefined } from "../../utils/object.ts";
import type { CreateFunction, DeleteFunction, Executors, UpdateFunction } from "./executor.ts";
import { lambdaFunctionPath } from "./path.ts";
import { findConfigDependencies } from "../../dependencies.ts";
import type { ConfigDependency } from "../../types/dependencies.ts";

function getCurrent(functions: LambdaFunctionState = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: FunctionConfigState;
      state: FunctionState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(functions)) {
    previous[lambdaFunctionPath(name)] = {
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

function getNext(config: LambdaFunctionConfig = {}, region: string, tags?: Tags) {
  const next: {
    [path: string]: {
      name: string;
      config: FunctionConfig;
      dependsOn: ConfigDependency[];
    };
  } = {};

  for (const [name, func] of Object.entries(config)) {
    const withTags = mergeProjectTags(func, tags);
    const withTagsAndRegion = addDefaultRegion(withTags, region);

    next[lambdaFunctionPath(name)] = {
      name,
      config: omitUndefined(withTagsAndRegion) as FunctionConfig,
      dependsOn: findConfigDependencies(withTagsAndRegion),
    };
  }
  return next;
}

export async function createLambdaFunctionPlan(
  executors: Executors,
  tags?: Tags,
  state?: LambdaFunctionState,
  config?: LambdaFunctionConfig,
): Promise<Plan> {
  const {
    getDefaultRegion,
    createFunction,
    deleteFunction,
    updateFunction,
    assertFunctionExist,
    assertFunctionNotExists,
    assertCreatePermission,
    assertDeletePermission,
    assertUpdatePermission,
  } = executors;
  logger.debug(
    "[AWS] Planning for lambda function changes",
    {
      state,
      config,
    },
  );
  const plan: Plan = [];

  const region = getDefaultRegion();
  const previous = getCurrent(state);
  const next = getNext(config, region, tags);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { config, name, dependsOn } = next[key];

    assertRegion(config);
    assertBranch(config);

    const { region } = config;

    await assertFunctionNotExists(name, region);
    await assertCreatePermission(name, region);

    const createUnit: CreateUnit<FunctionConfig, FunctionState, CreateFunction> = {
      type: Type.Create,
      executor: createFunction,
      args: [name, config],
      path: key,
      config,
      dependsOn,
    };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));
  for (const key of deleting) {
    const { state, name } = previous[key];
    const { config: { region } } = state;

    await assertFunctionExist(name, region);
    await assertDeletePermission(name, region);

    const deleteUnit: DeleteUnit<FunctionState, DeleteFunction> = {
      type: Type.Delete,
      executor: deleteFunction,
      args: [region, name],
      path: key,
      state,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextConfig, dependsOn } = next[key];
    const { config: previousConfig, state, name } = previous[key];

    const isSameBaseConfig = await isLambdaConfigEqual(nextConfig, previousConfig);
    if (isSameBaseConfig) {
      const noopUnit: NoopUnit<FunctionConfigState, FunctionState> = {
        type: Type.Noop,
        path: key,
        config: previousConfig,
        state,
      };
      plan.push(noopUnit);
    } else {
      if (nextConfig.region !== previousConfig.region) {
        throw new Error(
          "It is not possible to update lambda function region, create new migrate data",
        );
      }

      assertBranch(nextConfig);
      assertRegion(nextConfig);

      const { region } = nextConfig;

      await assertFunctionExist(name, region);
      await assertUpdatePermission(name, region);

      const updateUnit: UpdateUnit<
        FunctionConfig,
        FunctionState,
        UpdateFunction
      > = {
        type: Type.Update,
        executor: updateFunction,
        args: [nextConfig, state],
        path: key,
        state,
        config: nextConfig,
        dependsOn,
      };
      plan.push(updateUnit);
    }
  }

  return await Promise.resolve(plan);
}

export async function createLambdaFunctionDestroyPlan(
  executors: Executors,
  state?: LambdaFunctionState,
) {
  const {
    deleteFunction,
    assertFunctionExist,
    assertDeletePermission,
  } = executors;

  const plan: Plan = [];
  logger.debug("[AWS] Creating destroy lambda functions plan", {
    state,
  });

  const previous = getCurrent(state);
  for (const key of Object.keys(previous)) {
    const { state, name } = previous[key];
    const { config: { region } } = state;

    await assertFunctionExist(name, region);
    await assertDeletePermission(name, region);

    const deleteUnit: DeleteUnit<FunctionState, DeleteFunction> = {
      type: Type.Delete,
      executor: deleteFunction,
      args: [region, name],
      path: key,
      state: state,
    };
    plan.push(deleteUnit);
  }

  return Promise.resolve(plan);
}
