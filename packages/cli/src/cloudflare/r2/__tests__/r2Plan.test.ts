import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import { Type } from "../../../types/plan.ts";
import { createR2Plan } from "../plan.ts";
import type { CreateBucket, DeleteBucket, Executors } from "../plan.ts";
import type { BucketConfig, BucketState, R2Config, R2State } from "../types.ts";
import type { CreateUnit, DeleteUnit, NoopUnit } from "../../../types/plan.ts";
import { assertBranch } from "../../../utils/resource.ts";

const executors = {
  createBucket: spy(),
  deleteBucket: spy(),
  updateBucket: spy(),
} as Executors;

describe("cloudflare buckets", () => {
  describe("create bucket", () => {
    it("should create bucket for new config on default branch", async () => {
      const state = {};
      const config: R2Config = {
        "bucket1": {
          branch: "master",
          storageClass: "Standard",
        },
      };

      const result = await createR2Plan(
        executors,
        state,
        config,
      );

      assertBranch(config.bucket1);
      const execution: CreateUnit<BucketConfig, BucketState, CreateBucket> = {
        type: Type.Create,
        executor: executors.createBucket,
        args: ["bucket1", config.bucket1],
        path: "cloudflare.r2.bucket1",
        config: config.bucket1,
        dependsOn: [],
      };
      expect(result).toEqual([execution]);
    });
  });

  describe("update bucket", () => {
    it("should throw when trying to update a bucket", async () => {
      const state: R2State = {
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

      const config: R2Config = {
        "bucket1": {
          storageClass: "InfrequentAccess",
          locationHint: "eeur",
          branch: "master",
        },
      };
      await expect(createR2Plan(
        executors,
        state,
        config,
      )).rejects.toThrow("It is not possible to update r2 bucket, create new and migrate data");
    });
  });

  describe("delete bucket", () => {
    it("should delete previously created bucket", async () => {
      const state: R2State = {
        "bucket1": {
          storageClass: "Standard",
          location: "apac",
          createdAt: "2022-01-01T00:00:00.000Z",
          config: {
            branch: "master",
          },
        },
      };

      const config: R2Config = {};

      const result = await createR2Plan(
        executors,
        state,
        config,
      );

      const execution: DeleteUnit<BucketState, DeleteBucket> = {
        type: Type.Delete,
        executor: executors.deleteBucket,
        args: ["bucket1"],
        path: "cloudflare.r2.bucket1",
        state: state.bucket1,
      };
      expect(result).toEqual([execution]);
    });

    it("should delete and create bucket when bucket is renamed", async () => {
      const state: R2State = {
        "bucket1": {
          storageClass: "Standard",
          location: "apac",
          createdAt: "2022-01-01T00:00:00.000Z",
          config: {
            branch: "master",
          },
        },
      };

      const config: R2Config = {
        "bucket2": {
          storageClass: "InfrequentAccess",
          locationHint: "eeur",
          branch: "master",
        },
      };

      assertBranch(config.bucket2);
      const created: CreateUnit<BucketConfig, BucketState, CreateBucket> = {
        type: Type.Create,
        executor: executors.createBucket,
        args: ["bucket2", config.bucket2],
        path: "cloudflare.r2.bucket2",
        config: config.bucket2,
        dependsOn: [],
      };

      const deleted: DeleteUnit<BucketState, DeleteBucket> = {
        type: Type.Delete,
        executor: executors.deleteBucket,
        args: ["bucket1"],
        path: "cloudflare.r2.bucket1",
        state: state.bucket1,
      };

      const result = await createR2Plan(
        executors,
        state,
        config,
      );

      expect(result).toEqual([created, deleted]);
    });
  });

  describe("noop changes on bucket", () => {
    it("when state and config are the same", async () => {
      const state: R2State = {
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

      const config: R2Config = {
        "bucket1": {
          storageClass: "Standard",
          locationHint: "apac",
          branch: "master",
        },
      };
      const result = await createR2Plan(
        executors,
        state,
        config,
      );

      const noop: NoopUnit = {
        type: Type.Noop,
        path: "cloudflare.r2.bucket1",
        config: config.bucket1,
        state: state.bucket1,
      };
      expect(result).toEqual([noop]);
    });
  });
});
