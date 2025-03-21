import { logger } from "../../../../logger.ts";
import { mergeProjectTags } from "../../../../utils/tags.ts";
import { assertBranch } from "../../../../utils/resource.ts";
import { Type } from "../../../../types/plan.ts";
import { addDefaultRegion, assertRegion } from "../../../utils.ts";
import { omitUndefined } from "../../../../utils/object.ts";
import { cloudwatchLogGroupPath } from "./path.ts";
import type { Tags } from "../../../../types/config.ts";
import type { CreateLogGroup, DeleteLogGroup, Executors, UpdateLogGroup } from "./executor.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan, UpdateUnit } from "../../../../types/plan.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";
import type {
  CloudwatchLogGroupConfig,
  CloudwatchLogGroupState,
  LogGroupConfig,
  LogGroupState,
} from "./types.ts";
import { findResourceDependencies } from "../../../../dependencies.ts";
import { isConfigEqual } from "@/utils/config.ts";

function getCurrent(logGroups: CloudwatchLogGroupState = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: LogGroupConfig;
      state: LogGroupState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(logGroups)) {
    previous[cloudwatchLogGroupPath(name)] = {
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

function getNext(config: CloudwatchLogGroupConfig = {}, region: string, tags?: Tags) {
  const next: {
    [path: string]: {
      name: string;
      config: LogGroupConfig;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [name, logGroup] of Object.entries(config)) {
    const withTags = mergeProjectTags(logGroup, tags);
    const withTagsAndRegion = addDefaultRegion(withTags, region);

    next[cloudwatchLogGroupPath(name)] = {
      name,
      config: omitUndefined(withTagsAndRegion),
      dependsOn: findResourceDependencies(withTagsAndRegion),
    };
  }
  return next;
}

export async function createCloudwatchLogGroupPlan(
  executors: Executors,
  tags?: Tags,
  state?: CloudwatchLogGroupState,
  config?: CloudwatchLogGroupConfig,
): Promise<Plan> {
  const {
    getDefaultRegion,
    createLogGroup,
    deleteLogGroup,
    updateLogGroup,
    assertLogGroupExists,
    assertLogGroupNotExists,
    assertCreatePermission,
    assertDeletePermission,
    assertUpdatePermission,
  } = executors;
  logger.debug(
    "[Plan][AWS] Planning for cloudwatch log group changes",
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

    await assertLogGroupNotExists(name, region);
    await assertCreatePermission(name, region);

    const createUnit: CreateUnit<LogGroupConfig, LogGroupState, CreateLogGroup> = {
      type: Type.Create,
      executor: createLogGroup,
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

    await assertLogGroupExists(name, region);
    await assertDeletePermission(name, region);

    const deleteUnit: DeleteUnit<LogGroupState, DeleteLogGroup> = {
      type: Type.Delete,
      executor: deleteLogGroup,
      args: [region, name],
      path: key,
      state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextConfig, dependsOn } = next[key];
    const { config: previousConfig, state, name } = previous[key];

    const isSameBaseConfig = isConfigEqual(nextConfig, previousConfig);
    if (isSameBaseConfig) {
      const noopUnit: NoopUnit<LogGroupConfig, LogGroupState> = {
        type: Type.Noop,
        path: key,
        config: previousConfig,
        state,
        dependsOn: state.dependsOn,
      };
      plan.push(noopUnit);
    } else {
      if (nextConfig.region !== previousConfig.region) {
        throw new Error(
          "It is not possible to update cloudwatch log group region, create new and migrate",
        );
      }

      assertBranch(nextConfig);
      assertRegion(nextConfig);

      const { region } = nextConfig;

      await assertLogGroupExists(name, region);
      await assertUpdatePermission(name, region);

      const updateUnit: UpdateUnit<
        LogGroupConfig,
        LogGroupState,
        UpdateLogGroup
      > = {
        type: Type.Update,
        executor: updateLogGroup,
        args: [nextConfig.region, name, nextConfig, state],
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

export async function createCloudwatchLogGroupDestroyPlan(
  executors: Executors,
  state?: CloudwatchLogGroupState,
) {
  const {
    deleteLogGroup,
    assertLogGroupExists,
    assertDeletePermission,
  } = executors;

  const plan: Plan = [];
  logger.debug("[Plan][AWS] Creating destroy cloudwatch log group plan", {
    state,
  });

  const previous = getCurrent(state);
  for (const key of Object.keys(previous)) {
    const { state, name } = previous[key];
    const { config: { region } } = state;

    await assertLogGroupExists(name);
    await assertDeletePermission(name, region);

    const deleteUnit: DeleteUnit<LogGroupState, DeleteLogGroup> = {
      type: Type.Delete,
      executor: deleteLogGroup,
      args: [region, name],
      path: key,
      state: state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  return Promise.resolve(plan);
}
