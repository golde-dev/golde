import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import { Type } from "../../../types/plan.ts";
import { createCloudflareBucketsPlan } from "../cloudflare.ts";
import type { CreateBucket, DeleteBucket, Executors } from "../cloudflare.ts";
import type {
  CloudflareBucket,
  CloudflareBuckets,
  CloudflareBucketsState,
  CloudflareBucketState,
} from "../../types.ts";
import type { CreateUnit, DeleteUnit, NoopUnit } from "../../../types/plan.ts";

const executors = {
  createBucket: spy(),
  deleteBucket: spy(),
  updateBucket: spy(),
} as Executors;

describe("cloudflare buckets", () => {
  describe("create bucket", () => {
    it("should create bucket for new config on default branch", async () => {
      const state = {};
      const config: CloudflareBuckets = {
        "bucket1": {
          branch: "master",
          storageClass: "Standard",
        },
      };

      const result = await createCloudflareBucketsPlan(
        executors,
        state,
        config,
      );

      const execution: CreateUnit<CloudflareBucket, CloudflareBucketState, CreateBucket> = {
        type: Type.Create,
        executor: executors.createBucket,
        args: ["bucket1", config.bucket1],
        path: "buckets.cloudflare.bucket1",
        config: config.bucket1,
        dependsOn: [],
      };
      expect(result).toEqual([execution]);
    });
  });

  describe("update bucket", () => {
    it("should throw when trying to update a bucket", async () => {
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
          storageClass: "InfrequentAccess",
          locationHint: "eeur",
          branch: "master",
        },
      };
      await expect(createCloudflareBucketsPlan(
        executors,
        state,
        config,
      )).rejects.toThrow("It is not possible to update r2 bucket, create new and migrate data");
    });
  });

  describe("delete bucket", () => {
    it("should delete previously created bucket", async () => {
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
        state,
        config,
      );

      const execution: DeleteUnit<CloudflareBucketState, DeleteBucket> = {
        type: Type.Delete,
        executor: executors.deleteBucket,
        args: ["bucket1"],
        path: "buckets.cloudflare.bucket1",
        state: state.bucket1,
      };
      expect(result).toEqual([execution]);
    });
  });

  describe("noop changes on bucket", () => {
    it("when state and config are the same", async () => {
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
