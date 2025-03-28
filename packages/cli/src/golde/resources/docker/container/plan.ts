import { omitUndefined } from "@/utils/object.ts";
import { findResourceDependencies } from "@/dependencies.ts";
import { dockerContainerPath } from "./path.ts";
import { Type } from "@/types/plan.ts";
import { logger } from "@/logger.ts";
import { assertBranch } from "@/utils/resource.ts";
import { mergeProjectTags } from "@/utils/tags.ts";
import type { Tags } from "@/types/config.ts";
import type { Executors } from "./executor.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan, UpdateUnit } from "@/types/plan.ts";
import type { ResourceDependency } from "@/types/dependencies.ts";
import type {
  ContainerConfig,
  ContainersConfig,
  ContainersState,
  ContainerState,
} from "./types.ts";
import { isConfigEqual } from "@/utils/config.ts";

function getPrevious(containers: ContainersState = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: ContainerConfig;
      state: ContainerState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(containers)) {
    previous[dockerContainerPath(name)] = {
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

function getNext(config: ContainersConfig = {}, tags?: Tags) {
  const next: {
    [path: string]: {
      name: string;
      config: ContainerConfig;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [name, container] of Object.entries(config)) {
    const withTags = mergeProjectTags(container, tags);

    next[dockerContainerPath(name)] = {
      name,
      config: omitUndefined(container),
      dependsOn: findResourceDependencies(withTags),
    };
  }
  return next;
}
export async function createDockerContainerPlan(
  executors: Executors,
  tags?: Tags,
  state?: ContainersState,
  config?: ContainersConfig,
): Promise<Plan> {
  const {
    assertContainerNameAvailable,
    createContainer,
    deleteContainer,
    updateContainer,
  } = executors;

  logger.debug(
    "[Plan][Golde] Planning for Golde Docker containers",
    {
      state,
      config,
    },
  );
  const plan: Plan = [];

  const previous = getPrevious(state);
  const next = getNext(config, tags);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { config, name, dependsOn } = next[key];

    assertBranch(config);
    await assertContainerNameAvailable(name);

    const createUnit: CreateUnit<ContainerConfig, ContainerState, typeof createContainer> = {
      type: Type.Create,
      executor: createContainer,
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
    const { dependsOn } = state;

    const deleteUnit: DeleteUnit<ContainerState, typeof deleteContainer> = {
      type: Type.Delete,
      executor: deleteContainer,
      args: [name],
      path: key,
      state,
      dependsOn,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextConfig, dependsOn } = next[key];
    const { config: previousConfig, state, name } = previous[key];

    const isSameBaseConfig = isConfigEqual(nextConfig, previousConfig);
    if (isSameBaseConfig) {
      const noopUnit: NoopUnit<ContainerConfig, ContainerState> = {
        type: Type.Noop,
        path: key,
        config: previousConfig,
        state,
        dependsOn: state.dependsOn,
      };
      plan.push(noopUnit);
    } else {
      assertBranch(nextConfig);

      const updateUnit: UpdateUnit<
        ContainerConfig,
        ContainerState,
        typeof updateContainer
      > = {
        type: Type.Update,
        executor: updateContainer,
        args: [name, nextConfig, state],
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

export async function createDockerContainerDestroyPlan(
  executors: Executors,
  state?: ContainersState,
): Promise<Plan> {
  const {
    deleteContainer,
  } = executors;

  const plan: Plan = [];
  logger.debug("[Plan][Golde] Creating destroy docker containers plan", {
    state,
  });

  const previous = getPrevious(state);
  for (const key of Object.keys(previous)) {
    const { state, name } = previous[key];

    const deleteUnit: DeleteUnit<ContainerState, typeof deleteContainer> = {
      type: Type.Delete,
      executor: deleteContainer,
      args: [name],
      path: key,
      state: state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  return await Promise.resolve(plan);
}
