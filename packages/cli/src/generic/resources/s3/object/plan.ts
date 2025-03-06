import { findResourceDependencies } from "@/dependencies.ts";
import { logger } from "@/logger.ts";
import { getObject } from "./utils.ts";
import { Type } from "@/types/plan.ts";
import { omitUndefined } from "@/utils/object.ts";
import { assertBranch } from "@/utils/resource.ts";
import { mergeProjectTags } from "@/utils/tags.ts";
import type { Object, ObjectConfig, ObjectState, S3ObjectConfig, S3ObjectState } from "./types.ts";
import type { ResourceDependency } from "@/types/dependencies.ts";
import type { Tags, WithBranch } from "@/types/config.ts";
import type { CreateVersionUnit, DeleteUnit, DeleteVersionUnit, Plan } from "@/types/plan.ts";

export interface GenericExecutors {
  createObject: (
    name: string,
    object: { path: string; version: string },
    config: WithBranch<ObjectConfig>,
    dependsOn: ResourceDependency[],
  ) => Promise<ObjectState>;
  updateObject: (
    key: string,
    object: Object,
    config: WithBranch<ObjectConfig>,
    state: ObjectState,
    dependsOn: ResourceDependency[],
  ) => Promise<ObjectState>;
  deleteObject: (bucketName: string, name: string) => Promise<void>;
  assertCreatePermission: (bucketName: string, name: string) => Promise<void>;
  assertDeletePermission: (bucketName: string, name: string) => Promise<void>;
  assertObjectExist: (bucketName: string, name: string) => Promise<void>;
}

export function createS3PlanFactory<E extends GenericExecutors>(
  s3ObjectPath: (name: string) => string,
  s3VersionObjectPath: (version: string, name: string) => string,
  providerName = "AWS",
  serviceName = "S3",
) {
  function getCurrent(buckets: S3ObjectState = {}) {
    const previous: {
      [path: string]: {
        name: string;
        config: ObjectConfig;
        state: ObjectState;
      };
    } = {};

    for (const [name, { versions }] of Object.entries(buckets)) {
      for (const [version, state] of Object.entries(versions)) {
        const { config, ...rest } = state;
        previous[s3VersionObjectPath(version, name)] = {
          name,
          config,
          state: {
            ...rest,
            config,
          },
        };
      }
    }
    return previous;
  }

  async function getNext(config: S3ObjectConfig = {}, tags?: Tags) {
    const next: {
      [path: string]: {
        name: string;
        path: string;
        version: string;
        config: ObjectConfig;
        dependsOn: ResourceDependency[];
      };
    } = {};

    for (const [name, object] of Object.entries(config)) {
      const withTags = mergeProjectTags(object, tags);

      const { version, path } = await getObject(object);

      next[s3VersionObjectPath(version, name)] = {
        name,
        path,
        version,
        config: omitUndefined(withTags),
        dependsOn: findResourceDependencies(object),
      };
    }
    return next;
  }

  async function createS3ObjectPlan(
    executors: E,
    tags?: Tags,
    state?: S3ObjectState,
    config?: S3ObjectConfig,
  ): Promise<Plan> {
    const {
      createObject,
      deleteObject,
      assertCreatePermission,
      assertDeletePermission,
      assertObjectExist,
    } = executors;

    logger.debug(`[${providerName}] ${serviceName} object planning changes`, { state, config });

    const plan: Plan = [];

    const previous = getCurrent(state);
    const next = await getNext(config, tags);

    const creating = Object.keys(next).filter((key) => !(key in previous));
    for (const key of creating) {
      const { config, name, path, version, dependsOn } = next[key];
      const { bucketName } = config;
      assertBranch(config);

      await assertCreatePermission(bucketName, name);

      const object = {
        path,
        version,
      };
      const createVersionUnit: CreateVersionUnit<ObjectConfig, ObjectState, typeof createObject> = {
        type: Type.CreateVersion,
        executor: createObject,
        args: [name, object, config, dependsOn],
        version,
        path: s3ObjectPath(name),
        config,
        dependsOn,
      };
      plan.push(createVersionUnit);
    }

    const deleting = Object.keys(previous).filter((key) => !(key in next));
    for (const key of deleting) {
      const { state, name } = previous[key];
      const { config: { bucketName } } = state;

      await assertObjectExist(bucketName, name);
      await assertDeletePermission(bucketName, name);

      const deleteVersionUnit: DeleteVersionUnit<ObjectState, typeof deleteObject> = {
        type: Type.DeleteVersion,
        executor: deleteObject,
        version: state.version,
        args: [bucketName, key],
        path: s3ObjectPath(name),
        state,
      };
      plan.push(deleteVersionUnit);
    }

    // Add noop action if version already exist
    // Add change version if we change to existing version
    // Add delete if whole object is deleted
    // Add update object of for example tags changed

    return await Promise.resolve(plan);
  }

  async function createS3ObjectDestroyPlan(
    executors: GenericExecutors,
    state?: S3ObjectState,
  ): Promise<Plan> {
    logger.debug(`[${providerName}] ${serviceName} object planning destroying changes`, { state });
    const {
      deleteObject,
      assertObjectExist,
      assertDeletePermission,
    } = executors;

    const plan: Plan = [];
    logger.debug(`[${providerName}] ${serviceName} creating destroy objects plan`, {
      state,
    });

    const previous = getCurrent(state);
    for (const key of Object.keys(previous)) {
      const { state, name } = previous[key];
      const { config: { bucketName } } = state;

      await assertObjectExist(bucketName, name);
      await assertDeletePermission(bucketName, name);

      const deleteUnit: DeleteUnit<ObjectState, typeof deleteObject> = {
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

  return {
    createS3ObjectPlan,
    createS3ObjectDestroyPlan,
  };
}
