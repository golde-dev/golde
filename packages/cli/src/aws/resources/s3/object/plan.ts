import { findResourceDependencies } from "../../../../dependencies.ts";
import { logger } from "../../../../logger.ts";
import { s3ObjectPath, s3VersionObjectPath } from "./path.ts";
import { assertBranch } from "../../../../utils/resource.ts";
import { omitUndefined } from "../../../../utils/object.ts";
import { mergeProjectTags } from "../../../../utils/tags.ts";
import { Type } from "../../../../types/plan.ts";
import { getObject } from "../../../../utils/bucket.ts";
import type { Tags } from "../../../../types/config.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";
import type {
  CreateVersionUnit,
  DeleteUnit,
  DeleteVersionUnit,
  Plan,
} from "../../../../types/plan.ts";
import type { CreateObject, DeleteObject, Executors } from "./executor.ts";
import type { ObjectConfig, ObjectState, S3ObjectConfig, S3ObjectState } from "./types.ts";

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
      body: ReadableStream;
      version: string;
      config: ObjectConfig;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [name, object] of Object.entries(config)) {
    const withTags = mergeProjectTags(object, tags);

    const { version, body } = await getObject(object);

    next[s3VersionObjectPath(version, name)] = {
      name,
      body,
      version,
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
    assertCreatePermission,
    assertDeletePermission,
    assertObjectExist,
  } = executors;

  logger.debug("[AWS] S3 object planning changes", { state, config });

  const plan: Plan = [];

  const previous = getCurrent(state);
  const next = await getNext(config, tags);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { config, name, body, version, dependsOn } = next[key];
    const { bucketName } = config;
    assertBranch(config);

    await assertCreatePermission(bucketName, name);

    const object = {
      body,
      version,
    };
    const createVersionUnit: CreateVersionUnit<ObjectConfig, ObjectState, CreateObject> = {
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

    const deleteVersionUnit: DeleteVersionUnit<ObjectState, DeleteObject> = {
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
