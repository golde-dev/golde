import { findResourceDependencies } from "../../../dependencies.ts";
import { logger } from "../../../logger.ts";
import { s3ObjectPath } from "./path.ts";
import { assertBranch } from "../../../utils/resource.ts";
import { isEqual } from "@es-toolkit/es-toolkit";
import { omitUndefined } from "../../../utils/object.ts";
import { mergeProjectTags } from "../../../utils/tags.ts";
import { Type } from "../../../types/plan.ts";
import type { Tags } from "../../../types/config.ts";
import type { ResourceDependency } from "../../../types/dependencies.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan, UpdateUnit } from "../../../types/plan.ts";
import type { CreateObject, DeleteObject, Executors, UpdateObject } from "./executor.ts";
import type { Object, ObjectConfig, ObjectState, S3ObjectConfig, S3ObjectState } from "./types.ts";

async function getObject(config: ObjectConfig): Promise<Object> {
}

function getCurrent(buckets: S3ObjectState = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: ObjectConfig;
      state: ObjectState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(buckets)) {
    previous[s3ObjectPath(name)] = {
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

function getNext(config: S3ObjectConfig = {}, tags?: Tags) {
  const next: {
    [path: string]: {
      name: string;
      config: ObjectConfig;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [name, object] of Object.entries(config)) {
    const withTags = mergeProjectTags(object, tags);

    next[s3ObjectPath(name)] = {
      name,
      config: omitUndefined(withTags),
      dependsOn: findResourceDependencies(object),
    };
  }
  return next;
}

export async function createS3ObjectPlan(
  executors: Executors,
  tags?: Tags,
  state?: S3ObjectState,
  config?: S3ObjectConfig,
): Promise<Plan> {
  const {
    createObject,
    deleteObject,
    updateObject,
    assertCreatePermission,
    assertDeletePermission,
    assertUpdatePermission,
    assertObjectExist,
  } = executors;

  logger.debug("[AWS] S3 object planning changes", { state, config });

  const plan: Plan = [];

  const previous = getCurrent(state);
  const next = getNext(config, tags);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { config, name, dependsOn } = next[key];
    const { bucketName } = config;
    assertBranch(config);

    await assertCreatePermission(bucketName, name);

    const object = await getObject(config);
    const createUnit: CreateUnit<ObjectConfig, ObjectState, CreateObject> = {
      type: Type.Create,
      executor: createObject,
      args: [name, object, config, dependsOn],
      path: key,
      config,
      dependsOn,
    };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));
  for (const key of deleting) {
    const { state, name } = previous[key];
    const { config: { bucketName } } = state;

    await assertObjectExist(bucketName, name);
    await assertDeletePermission(bucketName, name);

    const deleteUnit: DeleteUnit<ObjectState, DeleteObject> = {
      type: Type.Delete,
      executor: deleteObject,
      args: [bucketName, name],
      path: key,
      state,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextConfig, dependsOn } = next[key];
    const { config: previousConfig, state, name } = previous[key];
    const { config: { bucketName } } = state;

    const object = await getObject(nextConfig);
    if (isEqual(nextConfig, previousConfig)) {
      const noopUnit: NoopUnit<ObjectConfig, ObjectState> = {
        type: Type.Noop,
        path: key,
        config: previousConfig,
        state,
        dependsOn,
      };
      plan.push(noopUnit);
    } else {
      if (nextConfig.bucketName !== previousConfig.bucketName) {
        throw new Error("It is not possible to update s3 bucket name");
      }
      assertBranch(nextConfig);

      await assertObjectExist(bucketName, name);
      await assertUpdatePermission(bucketName, name);

      const updateUnit: UpdateUnit<
        ObjectConfig,
        ObjectState,
        UpdateObject
      > = {
        type: Type.Update,
        executor: updateObject,
        args: [name, object, nextConfig, state, dependsOn],
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

export async function createS3ObjectDestroyPlan(
  executors: Executors,
  state?: S3ObjectState,
): Promise<Plan> {
  logger.debug("[AWS] S3 object planning destroying changes", { state });
  const {
    deleteObject,
    assertObjectExist,
    assertDeletePermission,
  } = executors;

  const plan: Plan = [];
  logger.debug("[AWS] Creating destroy S3 object plan", {
    state,
  });

  const previous = getCurrent(state);
  for (const key of Object.keys(previous)) {
    const { state, name } = previous[key];
    const { config: { bucketName } } = state;

    await assertObjectExist(bucketName, name);
    await assertDeletePermission(bucketName, name);

    const deleteUnit: DeleteUnit<ObjectState, DeleteObject> = {
      type: Type.Delete,
      executor: deleteObject,
      args: [bucketName, name],
      path: key,
      state: state,
    };
    plan.push(deleteUnit);
  }
  return plan;
}
