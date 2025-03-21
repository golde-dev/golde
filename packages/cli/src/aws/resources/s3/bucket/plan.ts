import { logger } from "../../../../logger.ts";
import { mergeProjectTags } from "../../../../utils/tags.ts";
import { assertBranch } from "../../../../utils/resource.ts";
import { Type } from "../../../../types/plan.ts";
import { addDefaultRegion, assertRegion } from "../../../utils.ts";
import { omitUndefined } from "../../../../utils/object.ts";
import { s3BucketPath } from "./path.ts";
import { findResourceDependencies } from "../../../../dependencies.ts";
import type { Tags } from "../../../../types/config.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan, UpdateUnit } from "../../../../types/plan.ts";
import type { BucketConfig, BucketState, S3BucketConfig, S3BucketState } from "./types.ts";
import type { CreateBucket, DeleteBucket, Executors, UpdateBucket } from "./executor.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";
import { isConfigEqual } from "@/utils/config.ts";

function getCurrent(buckets: S3BucketState = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: BucketConfig;
      state: BucketState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(buckets)) {
    previous[s3BucketPath(name)] = {
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

function getNext(config: S3BucketConfig = {}, region: string, tags?: Tags) {
  const next: {
    [path: string]: {
      name: string;
      config: BucketConfig;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [name, bucket] of Object.entries(config)) {
    const withTags = mergeProjectTags(bucket, tags);
    const withTagsAndRegion = addDefaultRegion(withTags, region);

    next[s3BucketPath(name)] = {
      name,
      config: omitUndefined(withTagsAndRegion),
      dependsOn: findResourceDependencies(bucket),
    };
  }
  return next;
}

export async function createS3Plan(
  executors: Executors,
  tags?: Tags,
  state?: S3BucketState,
  config?: S3BucketConfig,
): Promise<Plan> {
  const {
    getDefaultRegion,
    createBucket,
    deleteBucket,
    updateBucket,
    assertBucketExist,
    assertBucketNameAvailable,
    assertCreatePermission,
    assertDeletePermission,
    assertUpdatePermission,
  } = executors;
  logger.debug(
    "[AWS] Planning for s3 changes",
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
    const { config: nextConfig, name, dependsOn } = next[key];

    assertRegion(nextConfig);
    assertBranch(nextConfig);

    const { region } = nextConfig;

    await assertBucketNameAvailable(name, region);
    await assertCreatePermission(name, region);

    const createUnit: CreateUnit<BucketConfig, BucketState, CreateBucket> = {
      type: Type.Create,
      executor: createBucket,
      args: [name, nextConfig],
      path: key,
      config: nextConfig,
      dependsOn,
    };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));
  for (const key of deleting) {
    const { state, name } = previous[key];
    const { config: { region } } = state;

    await assertBucketExist(name, region);
    await assertDeletePermission(name, region);

    const deleteUnit: DeleteUnit<BucketState, DeleteBucket> = {
      type: Type.Delete,
      executor: deleteBucket,
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

    const isSameBaseConfig = isConfigEqual(nextConfig, previousConfig);
    if (isSameBaseConfig) {
      const noopUnit: NoopUnit<BucketConfig, BucketState> = {
        type: Type.Noop,
        path: key,
        config: previousConfig,
        state,
        dependsOn,
      };
      plan.push(noopUnit);
    } else {
      if (nextConfig.region !== previousConfig.region) {
        throw new Error(
          "It is not possible to update s3 bucket region, create new and migrate data",
        );
      }

      assertBranch(nextConfig);
      assertRegion(nextConfig);

      const { region } = nextConfig;

      await assertBucketExist(name, region);
      await assertUpdatePermission(name, region);

      const updateUnit: UpdateUnit<
        BucketConfig,
        BucketState,
        UpdateBucket
      > = {
        type: Type.Update,
        executor: updateBucket,
        args: [region, name, nextConfig, state],
        path: key,
        state,
        config: nextConfig,
        dependsOn,
      };
      plan.push(updateUnit);
    }
  }

  return plan;
}

export async function createS3DestroyPlan(
  executors: Executors,
  state?: S3BucketState,
) {
  const {
    deleteBucket,
    assertBucketExist,
    assertDeletePermission,
  } = executors;

  const plan: Plan = [];
  logger.debug("[AWS] Creating destroy s3 buckets plan", {
    state,
  });

  const previous = getCurrent(state);
  for (const key of Object.keys(previous)) {
    const { state, name } = previous[key];
    const { config: { region } } = state;

    await assertBucketExist(name);
    await assertDeletePermission(name, region);

    const deleteUnit: DeleteUnit<BucketState, DeleteBucket> = {
      type: Type.Delete,
      executor: deleteBucket,
      args: [region, name],
      path: key,
      state: state,
    };
    plan.push(deleteUnit);
  }

  return plan;
}
