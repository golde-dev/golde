import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import type { CloudflareBuckets, CloudflareBucketsState } from "../../types.ts";
import { type createBucket, type deleteBucket, type Executors } from "../cloudflare.ts";
import { createCloudflareBucketsPlan } from "../cloudflare.ts";
import { type ExecutionUnit, type MigrationUnit, Type } from "../../../types/plan.ts";
import type { GitInfo } from "../../../clients/git.ts";
import type { NoopUnit, SkipUnit } from "../../../types/plan.ts";

const executors = {
  createBucket: spy(),
  deleteBucket: spy(),
  updateBucket: spy(),
} as Executors;

describe("new bucket config", () => {
  it("should create bucket for new config on default branch", async () => {
    const git = {
      defaultBranch: "master",
      branchName: "master",
    } as GitInfo;

    const state = {};
    const config: CloudflareBuckets = {
      "bucket1": {
        storageClass: "Standard",
      },
    };

    const result = await createCloudflareBucketsPlan(
      executors,
      git,
      state,
      config,
    );

    const execution: ExecutionUnit<typeof createBucket> = {
      type: Type.Create,
      executor: executors.createBucket,
      args: [{
        storageClass: "Standard",
        name: "bucket1",
      }],
      path: "buckets.cloudflare.bucket1",
      dependencies: [],
    };
    expect(result).toEqual([execution]);
  });

  it("should skip bucket creation if branch is different", async () => {
    const git = {
      defaultBranch: "master",
      branchName: "develop",
    } as GitInfo;

    const state = {};
    const config: CloudflareBuckets = {
      "bucket1": {
        storageClass: "Standard",
      },
    };

    const result = await createCloudflareBucketsPlan(
      executors,
      git,
      state,
      config,
    );

    const skip: SkipUnit = {
      type: Type.Skip,
      path: "buckets.cloudflare.bucket1",
      config: config.bucket1,
    };

    expect(result).toEqual([skip]);
  });
});

describe("migrate bucket", () => {
  const executors = {
    createBucket: spy(),
    deleteBucket: spy(),
    updateBucket: spy(),
  } as Executors;

  it("should move bucket to different branch state, running on prev branch", async () => {
    const git = {
      defaultBranch: "master",
      branchName: "master",
    } as GitInfo;

    const state: CloudflareBucketsState = {
      "bucket1": {
        storageClass: "Standard",
        location: "apac",
        createdAt: "2022-01-01T00:00:00.000Z",
        config: {
          storageClass: "Standard",
        },
      },
    };

    const config: CloudflareBuckets = {
      "bucket1": {
        storageClass: "Standard",
        branch: "develop",
      },
    };

    const result = await createCloudflareBucketsPlan(
      executors,
      git,
      state,
      config,
    );

    const migration: MigrationUnit = {
      type: Type.Migrate,
      from: "master",
      to: "develop",
      path: "buckets.cloudflare.bucket1",
    };
    expect(result).toEqual([migration]);
  });

  it("should move bucket to different branch pattern running on new branch", async () => {
    const git = {
      defaultBranch: "master",
      branchName: "develop",
    } as GitInfo;

    const state: CloudflareBucketsState = {
      "bucket1": {
        storageClass: "Standard",
        location: "apac",
        createdAt: "2022-01-01T00:00:00.000Z",
        config: {
          storageClass: "Standard",
          branch: "master",
        },
      },
    };

    const config: CloudflareBuckets = {
      "bucket1": {
        storageClass: "Standard",
        branch: "develop",
      },
    };

    const result = await createCloudflareBucketsPlan(
      executors,
      git,
      state,
      config,
    );

    const migration: MigrationUnit = {
      type: Type.Migrate,
      from: "master",
      to: "develop",
      path: "buckets.cloudflare.bucket1",
    };
    expect(result).toEqual([migration]);
  });

  it("should not move bucket if running on different branch than from/to", async () => {
    const git = {
      defaultBranch: "master",
      branchName: "test",
    } as GitInfo;

    const state: CloudflareBucketsState = {
      "bucket1": {
        storageClass: "Standard",
        branch: "master",
        location: "apac",
        createdAt: "2022-01-01T00:00:00.000Z",
      },
    };

    const config: CloudflareBuckets = {
      "bucket1": {
        storageClass: "Standard",
        branch: "develop",
      },
    };
    const result = await createCloudflareBucketsPlan(
      executors,
      git,
      state,
      config,
    );

    const noop: SkipUnit = {
      type: Type.Skip,
      path: "buckets.cloudflare.bucket1",
      config: config.bucket1,
      state: state.bucket1,
    };
    expect(result).toEqual([noop]);
  });
});

describe("delete bucket", () => {
  it("should delete previously created bucket", async () => {
    const git = {
      defaultBranch: "master",
      branchName: "master",
    } as GitInfo;

    const state: CloudflareBucketsState = {
      "bucket1": {
        storageClass: "Standard",
        branch: "master",
        location: "apac",
        createdAt: "2022-01-01T00:00:00.000Z",
      },
    };

    const config: CloudflareBuckets = {};

    const result = await createCloudflareBucketsPlan(
      executors,
      git,
      state,
      config,
    );

    const execution: ExecutionUnit<typeof deleteBucket> = {
      type: Type.Delete,
      executor: executors.deleteBucket,
      args: ["bucket1"],
      path: "buckets.cloudflare.bucket1",
      dependencies: [],
    };
    expect(result).toEqual([execution]);
  });

  it("should not delete if running on different branch", async () => {
    const git = {
      defaultBranch: "master",
      branchName: "test",
    } as GitInfo;

    const config: CloudflareBuckets = {};
    const state: CloudflareBucketsState = {
      "bucket1": {
        storageClass: "Standard",
        branch: "master",
        location: "apac",
        createdAt: "2022-01-01T00:00:00.000Z",
      },
    };

    const result = await createCloudflareBucketsPlan(
      executors,
      git,
      state,
      config,
    );

    const skip: SkipUnit = {
      type: Type.Skip,
      path: "buckets.cloudflare.bucket1",
      config: config.bucket1,
      state: state.bucket1,
    };
    expect(result).toEqual([skip]);
  });
});

describe("noop changes on bucket", () => {
  it("when state and config are the same", async () => {
    const git = {
      defaultBranch: "master",
      branchName: "master",
    } as GitInfo;

    const state: CloudflareBucketsState = {
      "bucket1": {
        storageClass: "Standard",
        location: "apac",
        createdAt: "2022-01-01T00:00:00.000Z",
        config: {
          storageClass: "Standard",
          locationHint: "apac",
          branch: "master",
        },
      },
    };

    const config: CloudflareBuckets = {
      "bucket1": {
        storageClass: "Standard",
        locationHint: "apac",
        branch: "master",
      },
    };
    const result = await createCloudflareBucketsPlan(
      executors,
      git,
      state,
      config,
    );

    const noop: NoopUnit = {
      type: Type.Noop,
      path: "buckets.cloudflare.bucket1",
      config: config.bucket1,
      state: state.bucket1,
    };
    expect(result).toEqual([noop]);
  });
});

describe("update bucket", () => {
});
