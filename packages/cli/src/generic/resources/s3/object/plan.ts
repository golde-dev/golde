import { findResourceDependencies } from "@/dependencies.ts";
import { logger } from "@/logger.ts";
import { createObjectKey, getObject } from "./utils.ts";
import { Type } from "@/types/plan.ts";
import { omitUndefined } from "@/utils/object.ts";
import { assertBranch } from "@/utils/resource.ts";
import { mergeProjectTags } from "@/utils/tags.ts";
import type { ObjectConfig, ObjectsConfig, ObjectsState, ObjectState } from "./types.ts";
import type { ResourceDependency } from "@/types/dependencies.ts";
import type { OmitExecutionContext, Tags, WithBranch } from "@/types/config.ts";
import type {
  ChangeVersionUnit,
  CreateVersionUnit,
  DeleteUnit,
  DeleteVersionUnit,
  NoopUnit,
  Plan,
  UpdateVersionUnit,
} from "@/types/plan.ts";
import { isTemplate } from "@/utils/template.ts";
import { isConfigEqual } from "@/utils/config.ts";

export interface GenericExecutors {
  createObject: (
    name: string,
    object: { path: string; version: string },
    config: WithBranch<ObjectConfig>,
  ) => Promise<OmitExecutionContext<ObjectState>>;
  updateObject: (
    key: string,
    config: WithBranch<ObjectConfig>,
    state: ObjectState,
  ) => Promise<OmitExecutionContext<ObjectState>>;
  deleteObject: (bucketName: string, name: string) => Promise<void>;
  assertCreatePermission?: (bucketName: string, name: string) => Promise<void>;
  assertDeletePermission?: (bucketName: string, name: string) => Promise<void>;
  assertUpdatePermission?: (bucketName: string, name: string) => Promise<void>;
  assertObjectExist: (bucketName: string, name: string) => Promise<void>;
}

export function createS3PlanFactory<E extends GenericExecutors>(
  s3ObjectPath: (name: string) => string,
  providerName = "AWS",
  serviceName = "S3",
) {
  function getCurrent(objects: ObjectsState = {}) {
    const previous: {
      [name: string]: {
        [version: string]: {
          name: string;
          isCurrent: boolean;
          config: ObjectConfig;
          state: ObjectState;
        };
      };
    } = {};

    for (const [name, { versions, current }] of Object.entries(objects)) {
      for (const [version, state] of Object.entries(versions)) {
        if (!previous[name]) previous[name] = {};

        previous[name][version] = {
          name,
          config: state.config,
          isCurrent: version === current,
          state,
        };
      }
    }
    return previous;
  }

  async function getNext(config: ObjectsConfig = {}, tags?: Tags) {
    const next: {
      [name: string]: {
        name: string;
        path: string;
        version: string;
        config: ObjectConfig;
        dependsOn: ResourceDependency[];
      };
    } = {};

    for (const [name, object] of Object.entries(config)) {
      const withTags = mergeProjectTags(object, tags);
      const { version, path } = await getObject(name, object);

      next[name] = {
        name,
        path,
        version,
        config: omitUndefined(withTags),
        dependsOn: findResourceDependencies(object),
      };
    }
    return next;
  }

  async function createObjectPlan(
    executors: E,
    tags?: Tags,
    state?: ObjectsState,
    config?: ObjectsConfig,
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

    logger.debug(`[Plan][${providerName}] ${serviceName} object planning changes`, {
      state,
      config,
    });

    const plan: Plan = [];

    const previous = getCurrent(state);
    const next = await getNext(config, tags);

    const creating = Object.keys(next).filter((key) => !(key in previous));
    for (const key of creating) {
      const { config, name, path, version, dependsOn } = next[key];

      assertBranch(config);

      const { bucketName, branch } = config;
      const objectKey = createObjectKey(branch, version, name);
      const object = {
        path,
        version,
      };

      if (!isTemplate(bucketName)) {
        await assertCreatePermission?.(bucketName, objectKey);
      }

      const createVersionUnit: CreateVersionUnit<ObjectConfig, ObjectState, typeof createObject> = {
        type: Type.CreateVersion,
        executor: createObject,
        args: [objectKey, object, config],
        version,
        path: s3ObjectPath(name),
        config,
        dependsOn,
      };
      plan.push(createVersionUnit);
    }

    const deleting = Object.keys(previous).filter((key) => !(key in next));
    for (const key of deleting) {
      const deletedValues = Object.values(previous[key]);

      for (const { name, state } of deletedValues) {
        const { version, config: { bucketName, branch } } = state;

        const objectKey = createObjectKey(branch, version, name);

        await assertObjectExist(bucketName, objectKey);
        await assertDeletePermission?.(bucketName, objectKey);

        const deleteVersionUnit: DeleteVersionUnit<ObjectState, typeof deleteObject> = {
          type: Type.DeleteVersion,
          executor: deleteObject,
          version: state.version,
          args: [bucketName, objectKey],
          path: s3ObjectPath(name),
          state,
          dependsOn: state.dependsOn,
        };
        plan.push(deleteVersionUnit);
      }
    }

    const updating = Object.keys(previous).filter((key) => key in next);
    for (const key of updating) {
      const { version, path, config: nextConfig, dependsOn, name } = next[key];
      const previousObjectVersion = previous[key][version];

      assertBranch(nextConfig);
      const objectKey = createObjectKey(nextConfig.branch, version, name);

      if (previousObjectVersion) {
        const { config: previousConfig, isCurrent, state: prevState } = previousObjectVersion;

        /**
         * If object version existed, was current and config has no changed
         */
        if (isCurrent && isConfigEqual(nextConfig, previousConfig)) {
          const noopUnit: NoopUnit<ObjectConfig, ObjectState> = {
            type: Type.Noop,
            path: s3ObjectPath(name),
            config: previousConfig,
            state: prevState,
            dependsOn: dependsOn,
          };
          plan.push(noopUnit);
          continue;
        }
        /**
         * If object version existed but was not the current version and config is the same
         */
        if (!isCurrent && isConfigEqual(nextConfig, previousConfig)) {
          const changeVersionUnit: ChangeVersionUnit<ObjectConfig, ObjectState> = {
            type: Type.ChangeVersion,
            path: s3ObjectPath(name),
            config: nextConfig,
            version,
            state: {
              ...prevState,
              dependsOn: dependsOn,
            },
            dependsOn: dependsOn,
          };
          plan.push(changeVersionUnit);
          continue;
        }

        if (!isConfigEqual(nextConfig, previousConfig)) {
          if (!isTemplate(nextConfig.bucketName)) {
            assertUpdatePermission?.(nextConfig.bucketName, objectKey);
          }

          const updateVersionUnit: UpdateVersionUnit<
            ObjectConfig,
            ObjectState,
            typeof updateObject
          > = {
            type: Type.UpdateVersion,
            executor: updateObject,
            args: [objectKey, nextConfig, prevState],
            version,
            state: prevState,
            path: s3ObjectPath(name),
            config: nextConfig,
            dependsOn,
          };
          plan.push(updateVersionUnit);
          continue;
        }
      }

      const object = {
        path,
        version,
      };
      if (!isTemplate(nextConfig.bucketName)) {
        await assertCreatePermission?.(nextConfig.bucketName, objectKey);
      }
      const createVersionUnit: CreateVersionUnit<ObjectConfig, ObjectState, typeof createObject> = {
        type: Type.CreateVersion,
        executor: createObject,
        args: [objectKey, object, nextConfig],
        version,
        path: s3ObjectPath(name),
        config: nextConfig,
        dependsOn,
      };
      plan.push(createVersionUnit);
    }

    return await Promise.resolve(plan);
  }

  async function createObjectDestroyPlan(
    executors: GenericExecutors,
    state?: ObjectsState,
  ): Promise<Plan> {
    logger.debug(`[Plan][${providerName}] ${serviceName} object planning destroying changes`, {
      state,
    });
    const {
      deleteObject,
      assertObjectExist,
      assertDeletePermission,
    } = executors;

    const plan: Plan = [];
    logger.debug(`[Plan][${providerName}] ${serviceName} creating destroy objects plan`, {
      state,
    });

    const previous = getCurrent(state);
    for (const key of Object.keys(previous)) {
      const entriesToDelete = Object.values(previous[key]);

      for (const { name, state } of entriesToDelete) {
        const { version, config: { bucketName, branch } } = state;

        const objectKey = createObjectKey(branch, version, name);

        await assertObjectExist(bucketName, objectKey);
        await assertDeletePermission?.(bucketName, objectKey);

        const deleteUnit: DeleteUnit<ObjectState, typeof deleteObject> = {
          type: Type.Delete,
          executor: deleteObject,
          args: [bucketName, objectKey],
          path: key,
          state: state,
          dependsOn: state.dependsOn,
        };
        plan.push(deleteUnit);
      }
    }
    return plan;
  }

  return {
    createObjectPlan,
    createObjectDestroyPlan,
  };
}
