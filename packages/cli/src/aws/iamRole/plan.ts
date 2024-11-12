import { logger } from "../../logger.ts";
import { mergeProjectTags } from "../../utils/tags.ts";
import type { Tags } from "../../types/config.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan, UpdateUnit } from "../../types/plan.ts";
import type { IAMRoleConfig, IAMRoleState, RoleConfig, RoleState } from "./types.ts";
import { assertBranch } from "../../utils/resource.ts";
import { isEqual } from "@es-toolkit/es-toolkit";
import { Type } from "../../types/plan.ts";
import { assertRegion } from "../utils.ts";
import type { CreateRole, DeleteRole, Executors, UpdateRole } from "./executor.ts";
import { omitUndefined } from "../../utils/object.ts";

function getCurrent(roles: IAMRoleState = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: RoleConfig;
      state: RoleState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(roles)) {
    previous[`aws.iamRole.${name}`] = {
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

function getNext(config: IAMRoleConfig = {}, tags?: Tags) {
  const next: {
    [path: string]: {
      name: string;
      config: RoleConfig;
    };
  } = {};

  for (const [name, bucket] of Object.entries(config)) {
    const withTags = mergeProjectTags(bucket, tags);

    next[`aws.iamRole.${name}`] = {
      name,
      config: omitUndefined(withTags),
    };
  }
  return next;
}

export async function createIAMRolePlan(
  executors: Executors,
  tags?: Tags,
  state?: IAMRoleState,
  config?: IAMRoleConfig,
): Promise<Plan> {
  const {
    createRole,
    deleteRole,
    updateRole,
    assertRoleExist,
    assertRoleNotExist,
    assertCreatePermission,
    assertDeletePermission,
    assertUpdatePermission,
  } = executors;
  logger.debug(
    "[AWS] Planning for IAM roles changes",
    {
      state,
      config,
    },
  );
  const plan: Plan = [];

  const previous = getCurrent(state);
  const next = getNext(config, tags);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { config, name } = next[key];

    assertBranch(config);
    await assertRoleNotExist(name);
    await assertCreatePermission(name);

    const createUnit: CreateUnit<RoleConfig, RoleState, CreateRole> = {
      type: Type.Create,
      executor: createRole,
      args: [name, config],
      path: key,
      config,
      dependsOn: [],
    };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));
  for (const key of deleting) {
    const { state, name } = previous[key];

    await assertRoleExist(name);
    await assertDeletePermission(name);

    const deleteUnit: DeleteUnit<RoleState, DeleteRole> = {
      type: Type.Delete,
      executor: deleteRole,
      args: [name],
      path: key,
      state,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextConfig } = next[key];
    const { config: previousConfig, state, name } = previous[key];

    const isSameBaseConfig = isEqual(nextConfig, previousConfig);
    if (isSameBaseConfig) {
      const noopUnit: NoopUnit<RoleConfig, RoleState> = {
        type: Type.Noop,
        path: key,
        config: previousConfig,
        state,
      };
      plan.push(noopUnit);
    } else {
      if (nextConfig.path !== previousConfig.path) {
        throw new Error(
          "It is not possible to update IAM role PATH, create new and migrate",
        );
      }

      await assertRoleExist(name);
      await assertUpdatePermission(name);

      assertRegion(nextConfig);
      assertBranch(nextConfig);

      const updateUnit: UpdateUnit<
        RoleConfig,
        RoleState,
        UpdateRole
      > = {
        type: Type.Update,
        executor: updateRole,
        args: [name, nextConfig, state],
        path: key,
        state,
        config: nextConfig,
        dependsOn: [],
      };
      plan.push(updateUnit);
    }
  }

  return await Promise.resolve(plan);
}

export async function createIAMRoleDestroyPlan(
  executors: Executors,
  state?: IAMRoleState,
) {
  const {
    deleteRole,
    assertRoleExist,
    assertDeletePermission,
  } = executors;

  const plan: Plan = [];
  logger.debug("[AWS] Creating destroy buckets plan", {
    state,
  });

  const previous = getCurrent(state);
  for (const key of Object.keys(previous)) {
    const { state, name } = previous[key];

    await assertRoleExist(name);
    await assertDeletePermission(name);

    const deleteUnit: DeleteUnit<RoleState, DeleteRole> = {
      type: Type.Delete,
      executor: deleteRole,
      args: [name],
      path: key,
      state: state,
    };
    plan.push(deleteUnit);
  }

  return Promise.resolve(plan);
}
