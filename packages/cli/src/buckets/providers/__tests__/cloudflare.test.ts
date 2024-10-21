import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import { Type } from "../../../types/plan.ts";
import { createCloudflareBucketsPlan } from "../cloudflare.ts";
import type { CreateBucket, DeleteBucket, Executors } from "../cloudflare.ts";
import type { GitInfo } from "../../../clients/git.ts";
import type {
  CloudflareBucket,
  CloudflareBuckets,
  CloudflareBucketsState,
  CloudflareBucketState,
} from "../../types.ts";
import type {
  CreateUnit,
  DeleteUnit,
  MigrationUnit,
  NoopUnit,
  SkipUnit,
} from "../../../types/plan.ts";

const executors = {
  createBucket: spy(),
  deleteBucket: spy(),
  updateBucket: spy(),
} as Executors;

describe("cloudflare buckets", () => {
  describe("create bucket", () => {
    it("should create bucket for new config on default branch", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "master",
      } as GitInfo;

      const state = {};
      const config: CloudflareBuckets = {
        "bucket1": {
          branch: "master",
          storageClass: "Standard",
        },
      };

      const result = await createCloudflareBucketsPlan(
        executors,
        git,
        state,
        config,
      );

      const execution: CreateUnit<CloudflareBucket, CloudflareBucketState, CreateBucket> = {
        type: Type.Create,
        executor: executors.createBucket,
        args: ["bucket1", config.bucket1],
        path: "buckets.cloudflare.bucket1",
        config: config.bucket1,
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
          branch: "master",
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

  describe("update bucket", () => {
    it("should throw when trying to update a bucket", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "master",
      } as GitInfo;

      const state: CloudflareBucketsState = {
        "bucket1": {
          storageClass: "Standard",
          location: "eeur",
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
      await expect(() =>
        createCloudflareBucketsPlan(
          executors,
          git,
          state,
          config,
        )
      ).toThrow("It is not possible to update r2 bucket, create new and migrate data");
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
          location: "apac",
          createdAt: "2022-01-01T00:00:00.000Z",
          config: {
            branch: "master",
          },
        },
      };

      const config: CloudflareBuckets = {};

      const result = await createCloudflareBucketsPlan(
        executors,
        git,
        state,
        config,
      );

      const execution: DeleteUnit<CloudflareBucketState, DeleteBucket> = {
        type: Type.Delete,
        executor: executors.deleteBucket,
        args: ["bucket1"],
        path: "buckets.cloudflare.bucket1",
        dependencies: [],
        state: state.bucket1,
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
          location: "apac",
          createdAt: "2022-01-01T00:00:00.000Z",
          config: {
            branch: "master",
          },
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

  describe("migrate bucket", () => {
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
          location: "apac",
          createdAt: "2022-01-01T00:00:00.000Z",
          config: {
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

      const noop: SkipUnit = {
        type: Type.Skip,
        path: "buckets.cloudflare.bucket1",
        config: config.bucket1,
        state: state.bucket1,
      };
      expect(result).toEqual([noop]);
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
});
