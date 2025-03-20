import { isEqual } from "@es-toolkit/es-toolkit";
import { Type } from "../../../../types/plan.ts";
import { assertBranch } from "../../../../utils/resource.ts";
import { logger } from "../../../../logger.ts";
import { omitUndefined } from "../../../../utils/object.ts";
import { r2BucketPath } from "./path.ts";
import { findResourceDependencies } from "../../../../dependencies.ts";
import type { CreateUnit, Plan } from "../../../../types/plan.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";
import type { DeleteUnit, NoopUnit } from "../../../../types/plan.ts";
import type { BucketConfig, BucketState, R2BucketConfig, R2BucketState } from "./types.ts";
import type { CreateBucket, DeleteBucket, Executors } from "./executor.ts";

function getPrevious(buckets: R2BucketState = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: BucketConfig;
      rawConfig: BucketConfig;
      state: BucketState;
    };
  } = {};

  for (const [name, { config, rawConfig, ...rest }] of Object.entries(buckets)) {
    previous[r2BucketPath(name)] = {
      name,
      config,
      rawConfig,
      state: {
        ...rest,
        config,
        rawConfig,
      },
    };
  }
  return previous;
}

function getNext(config: R2BucketConfig = {}) {
  const next: {
    [path: string]: {
      name: string;
      config: BucketConfig;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [name, bucket] of Object.entries(config)) {
    next[r2BucketPath(name)] = {
      name,
      config: omitUndefined(bucket),
      dependsOn: findResourceDependencies(bucket),
    };
  }
  return next;
}

export async function createR2Plan(
  executors: Executors,
  state?: R2BucketState,
  config?: R2BucketConfig,
): Promise<Plan> {
  logger.debug("[Cloudflare] Creating buckets plan", {
    state,
    config,
  });

  const plan: Plan = [];

  const previous = getPrevious(state);
  const next = getNext(config);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { config, name, dependsOn } = next[key];

    assertBranch(config);
    const createUnit: CreateUnit<BucketConfig, BucketState, CreateBucket> = {
      type: Type.Create,
      executor: executors.createBucket,
      args: [name, config, dependsOn],
      path: key,
      config,
      dependsOn,
    };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));
  for (const key of deleting) {
    const { state, name } = previous[key];
    const deleteUnit: DeleteUnit<BucketState, DeleteBucket> = {
      type: Type.Delete,
      executor: executors.deleteBucket,
      args: [name],
      path: key,
      state,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextRawConfig } = next[key];
    const { rawConfig: previousRawConfig, state } = previous[key];

    const isSameBaseConfig = isEqual(nextRawConfig, previousRawConfig);
    if (isSameBaseConfig) {
      const noopUnit: NoopUnit<BucketConfig, BucketState> = {
        type: Type.Noop,
        path: key,
        config: previousRawConfig,
        state,
        dependsOn: state.dependsOn,
      };
      plan.push(noopUnit);
    } else {
      throw new Error("It is not possible to update r2 bucket, create new and migrate data");
    }
  }

  return await Promise.resolve(plan);
}

export function createR2DestroyPlan(
  executors: Executors,
  state?: R2BucketState,
) {
  const plan: Plan = [];
  logger.debug("[Cloudflare] Creating buckets plan", {
    state,
  });

  const previous = getPrevious(state);
  for (const key of Object.keys(previous)) {
    const { state, name } = previous[key];
    const deleteUnit: DeleteUnit<BucketState, DeleteBucket> = {
      type: Type.Delete,
      executor: executors.deleteBucket,
      args: [name],
      path: key,
      state: state,
    };
    plan.push(deleteUnit);
  }

  return Promise.resolve(plan);
}
