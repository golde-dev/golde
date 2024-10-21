import { isEqual } from "moderndash";
import type { CloudflareClient } from "../../clients/cloudflare.ts";
import type { GitInfo } from "../../clients/git.ts";
import type { NoopUnit, SkipUnit } from "../../types/plan.ts";
import type { DeleteUnit, MigrationUnit } from "../../types/plan.ts";
import { Type, type CreateUnit, type Plan } from "../../types/plan.ts";
import { assertBranch } from "../../utils/resource.ts";
import type {
  CloudflareBucket,
  CloudflareBuckets,
  CloudflareBucketsState,
  CloudflareBucketState,
} from "../types.ts";

export async function createBucket(
  this: CloudflareClient,
  name: string,
  config: CloudflareBucket,
): Promise<CloudflareBucketState> {
  assertBranch(config);

  return await this.createBucket({
    name,
    locationHint: config.locationHint,
    storageClass: config.storageClass,
  }).then((b) => {
    return {
      location: b.location,
      createdAt: b.creation_date,
      storageClass: b.storage_class,
      config,
    };
  });
}
export type CreateBucket = typeof createBucket;

export function updateBucket(
  this: CloudflareClient,
) {
  throw new Error("It is not possible to update r2 bucket, create new and migrate data");
}

export async function deleteBucket(this: CloudflareClient, name: string) {
  return await this.deleteBucket(name);
}
export type DeleteBucket = typeof deleteBucket;

export const createCloudflareBucketsExecutors = (cloudflare: CloudflareClient) => {
  return {
    createBucket: createBucket.bind(cloudflare),
    deleteBucket: deleteBucket.bind(cloudflare),
    updateBucket: updateBucket.bind(cloudflare),
  };
};

export type Executors = ReturnType<typeof createCloudflareBucketsExecutors>;

function getCurrent(buckets: CloudflareBucketsState = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: CloudflareBucket;
      state: Omit<CloudflareBucketState, "config">;
      original: CloudflareBucketState;
    };
  } = {} ;

  for (const [name, {config, ...rest}] of Object.entries(buckets)) {
    previous[`buckets.cloudflare.${name}`] = {
      name,
      config,
      state: rest,
      original: {
        ...rest,
        config,
      },
    };
  }
  return previous;
}

function getNext(config: CloudflareBuckets = {}) {
  const next: {
    [path: string]: {
      name: string;
      config: CloudflareBucket;
    };
  } = {};

  for (const [name, bucket] of Object.entries(config)) {
    next[`buckets.cloudflare.${name}`] = {
      name,
      config: bucket,
    };
  }
  return next;
}


export async function createCloudflareBucketsPlan(
  executors: Executors,
  git: GitInfo,
  state?: CloudflareBucketsState,
  config?: CloudflareBuckets,
): Promise<Plan>{
  const plan: Plan = [];
  const {
    branchName,
  } = git;

  const previous = getCurrent(state);
  const next = getNext(config);

  // Buckets to create
  const toCreateCandidates = Object.keys(next).filter(key => !(key in previous));
  for (const key of toCreateCandidates) {
    const {config, name} = next[key];
    if(config.branch !== branchName) {
      const skipUnit: SkipUnit<CloudflareBucket, CloudflareBucketState> = {
        type: Type.Skip,
        path: key,
        config,
        reason:`Bucket owner branch: ${config.branch}, current branch: ${branchName}`,
      };
      plan.push(skipUnit);
      continue;
    }
    const createUnit: CreateUnit<CloudflareBucket, CloudflareBucketState, CreateBucket> = {
      type: Type.Create,
      executor: executors.createBucket,
      args: [name, config],
      path: key,
      config,
      dependencies: []
    };
    plan.push(createUnit);
  }

  // Buckets to delete
  const toDeleteCandidates = Object.keys(previous).filter(key => !(key in next));
  for (const key of toDeleteCandidates) {
    const {original, config, name} = previous[key];
    if(config.branch !== branchName) {
      const skipUnit: SkipUnit<CloudflareBucket, CloudflareBucketState> = {
        type: Type.Skip,
        path: key,
        state: original,
        reason:`Bucket owner branch: ${config.branch}, current branch: ${branchName}`,
      };
      plan.push(skipUnit);
      continue;
    }
    const deleteUnit: DeleteUnit<CloudflareBucketState, DeleteBucket> = {
      type: Type.Delete,
      executor: executors.deleteBucket,
      args: [name],
      path: key,
      state: original,
      dependencies: []
    };
    plan.push(deleteUnit);
  }

  // Buckets to update, migrate or noop
  const toUpdateCandidates = Object.keys(next).filter(key => key in previous);
  for (const key of toUpdateCandidates) {
    const {config: nextConfig} = next[key];
    const {config: previousConfig, original} = previous[key];

    const {
      branch: nextBranch,
      ...restNextConfig
    } = nextConfig;
    const {
      branch: previousBranch,
      ...restPreviousConfig
    } = previousConfig;

    const isSameBaseConfig = isEqual(restNextConfig, restPreviousConfig);
    const isOnOwnerBranch = previousBranch === branchName;
    const isOnTargetBranch = nextBranch === branchName;
    const isSameBranch = nextBranch === previousBranch;
    const isOnOwnerOrTargetBranch = isOnOwnerBranch || isOnTargetBranch;

    if(!isSameBranch && isOnOwnerOrTargetBranch) {
      if(isSameBaseConfig) {
        const migrationUnit: MigrationUnit = {
          type: Type.Migrate,
          path: key,
          from: previousBranch as string,
          to: nextBranch as string,
        };
        plan.push(migrationUnit);
        continue;
      }
    }

    if(isSameBranch && isOnOwnerBranch) {
      if(isSameBaseConfig) {
        const noopUnit: NoopUnit<CloudflareBucket, CloudflareBucketState> = {
          type: Type.Noop,
          path: key,
          config: previousConfig,
          state: original,
        };
        plan.push(noopUnit);
        continue;
      } else {
        throw new Error("It is not possible to update r2 bucket, create new and migrate data");
      }
    } else {
      const skipUnit: SkipUnit<CloudflareBucket, CloudflareBucketState> = {
        type: Type.Skip,
        path: key,
        config: nextConfig,
        state: original,
        reason: `Bucket owner branch: ${previousBranch}, current branch: ${branchName}`,
      };
      plan.push(skipUnit);
    }
  }

  return await Promise.resolve(plan);
};
