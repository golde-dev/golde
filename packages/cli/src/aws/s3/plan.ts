import { logger } from "../../logger.ts";
import { mergeProjectTags } from "../../utils/tags.ts";
import type { Tags } from "../../types/config.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan, UpdateUnit } from "../../types/plan.ts";
import type { BucketConfig, BucketState, S3Config, S3State } from "./types.ts";
import { assertBranch } from "../../utils/resource.ts";
import { isEqual } from "@es-toolkit/es-toolkit";
import { Type } from "../../types/plan.ts";
import { addDefaultRegion, assertRegion } from "../utils.ts";
import type { CreateBucket, DeleteBucket, Executors, UpdateBucket } from "./executor.ts";
import { omitUndefined } from "../../utils/object.ts";

function getCurrent(buckets: S3State = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: BucketConfig;
      state: BucketState;
    };
  } = {};

  for (const [name, { config, ...rest }] of Object.entries(buckets)) {
    previous[`aws.s3.${name}`] = {
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

function getNext(config: S3Config = {}, region: string, tags?: Tags) {
  const next: {
    [path: string]: {
      name: string;
      config: BucketConfig;
    };
  } = {};

  for (const [name, bucket] of Object.entries(config)) {
    const withTags = mergeProjectTags(bucket, tags);
    const withTagsAndRegion = addDefaultRegion(withTags, region);

    next[`aws.s3.${name}`] = {
      name,
      config: omitUndefined(withTagsAndRegion),
    };
  }
  return next;
}

export async function createS3Plan(
  executors: Executors,
  tags?: Tags,
  state?: S3State,
  config?: S3Config,
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
    const { config, name } = next[key];
    const { region } = config;

    assertRegion(config);
    assertBranch(config);

    await assertBucketNameAvailable(name, region);
    await assertCreatePermission(name, region);

    const createUnit: CreateUnit<BucketConfig, BucketState, CreateBucket> = {
      type: Type.Create,
      executor: createBucket,
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
    const { config: nextConfig } = next[key];
    const { config: previousConfig, state, name } = previous[key];
    const { region } = nextConfig;

    const isSameBaseConfig = isEqual(nextConfig, previousConfig);
    if (isSameBaseConfig) {
      const noopUnit: NoopUnit<BucketConfig, BucketState> = {
        type: Type.Noop,
        path: key,
        config: previousConfig,
        state,
      };
      plan.push(noopUnit);
    } else {
      if (nextConfig.region !== previousConfig.region) {
        throw new Error(
          "It is not possible to update s3 bucket region, create new and migrate data",
        );
      }

      await assertBucketExist(name, region);
      await assertUpdatePermission(name, region);

      assertRegion(nextConfig);
      assertBranch(nextConfig);

      const updateUnit: UpdateUnit<
        BucketConfig,
        BucketState,
        UpdateBucket
      > = {
        type: Type.Update,
        executor: updateBucket,
        args: [nextConfig.region, name, nextConfig],
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

export async function createS3DestroyPlan(
  executors: Executors,
  state?: S3State,
) {
  const {
    deleteBucket,
    assertBucketExist,
    assertDeletePermission,
  } = executors;

  const plan: Plan = [];
  logger.debug("[AWS] Creating destroy buckets plan", {
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

  return Promise.resolve(plan);
}
