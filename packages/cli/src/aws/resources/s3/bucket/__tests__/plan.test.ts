import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import { Type } from "../../../../../types/plan.ts";
import { createS3Plan } from "../plan.ts";
import type { CreateBucket, DeleteBucket, Executors, UpdateBucket } from "../executor.ts";
import type { BucketConfig, BucketState, S3BucketConfig, S3BucketState } from "../types.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, UpdateUnit } from "../../../../../types/plan.ts";
import { assertBranch } from "../../../../../utils/resource.ts";
import { mergeProjectTags, mergeTags } from "../../../../../utils/tags.ts";
import { addDefaultRegion } from "../../../../utils.ts";

const executors = {
  getDefaultRegion: () => "us-east-1",
  assertBucketExist: spy(),
  assertBucketNotExist: spy(),
  assertCreatePermission: spy(),
  assertDeletePermission: spy(),
  assertUpdatePermission: spy(),
  assertBucketNameAvailable: spy(),
  createBucket: spy(),
  deleteBucket: spy(),
  updateBucket: spy(),
} as Executors;

describe("aws s3 buckets", () => {
  const projectTags = {
    ProjectCode: "my-project",
    Environment: "production",
  };
  describe("create bucket", () => {
    it("should create bucket for new config on default branch", async () => {
      const state = {};
      const config: S3BucketConfig = {
        "bucket1": {
          branch: "master",
          tags: { Type: "Test" },
        },
      };

      const result = await createS3Plan(
        executors,
        projectTags,
        state,
        config,
      );
      const region = executors.getDefaultRegion();
      const configWithTags = mergeProjectTags(config.bucket1, projectTags);
      const configWithRegion = addDefaultRegion(configWithTags, region);

      assertBranch(configWithRegion);

      const execution: CreateUnit<BucketConfig, BucketState, CreateBucket> = {
        type: Type.Create,
        executor: executors.createBucket,
        args: ["bucket1", configWithRegion],
        path: "aws.s3.bucket.bucket1",
        config: configWithRegion,
        dependsOn: [],
      };
      expect(result).toEqual([execution]);
    });
  });

  describe("update bucket", () => {
    it("should allow to update tags", async () => {
      const bucket1Config = {
        region: "us-east-1",
        tags: { Type: "Old" },
        branch: "master",
      };
      const state: S3BucketState = {
        "bucket1": {
          createdAt: "2022-01-01T00:00:00.000Z",
          arn: "arn:aws:s3:::bucket1",
          name: "bucket1",
          dependsOn: [],
          config: bucket1Config,
        },
      };

      const config: S3BucketConfig = {
        "bucket1": {
          tags: { Type: "new" },
          branch: "master",
          region: "us-east-1",
        },
      };
      const region = executors.getDefaultRegion();
      const configWithTags = mergeProjectTags(config.bucket1, projectTags);
      const configWithRegion = addDefaultRegion(configWithTags, region);

      assertBranch(configWithRegion);
      const updateUnit: UpdateUnit<
        BucketConfig,
        BucketState,
        UpdateBucket
      > = {
        type: Type.Update,
        executor: executors.updateBucket,
        args: [configWithRegion.region, "bucket1", configWithRegion, state.bucket1],
        path: "aws.s3.bucket.bucket1",
        state: state.bucket1,
        config: configWithRegion,
        dependsOn: [],
      };

      expect(
        await createS3Plan(
          executors,
          projectTags,
          state,
          config,
        ),
      ).toEqual([updateUnit]);
    });

    it("should throw when trying to update a bucket with different region", async () => {
      const bucket1Config = {
        region: "us-east-1",
        tags: { Type: "Old" },
        branch: "master",
      };
      const state: S3BucketState = {
        "bucket1": {
          createdAt: "2022-01-01T00:00:00.000Z",
          arn: "arn:aws:s3:::bucket1",
          name: "bucket1",
          dependsOn: [],
          config: bucket1Config,
        },
      };

      const config: S3BucketConfig = {
        "bucket1": {
          tags: { Type: "new" },
          region: "us-west-1",
          branch: "master",
        },
      };
      await expect(createS3Plan(
        executors,
        projectTags,
        state,
        config,
      )).rejects.toThrow(
        "It is not possible to update s3 bucket region, create new and migrate data",
      );
    });
  });

  describe("delete bucket", () => {
    it("should delete previously created bucket", async () => {
      const bucket1Config = {
        region: "us-east-1",
        tags: { Type: "Old" },
        branch: "master",
      };
      const state: S3BucketState = {
        "bucket1": {
          createdAt: "2022-01-01T00:00:00.000Z",
          arn: "arn:aws:s3:::bucket1",
          name: "bucket1",
          dependsOn: [],
          config: bucket1Config,
        },
      };

      const config: S3BucketConfig = {};

      const result = await createS3Plan(
        executors,
        projectTags,
        state,
        config,
      );

      const execution: DeleteUnit<BucketState, DeleteBucket> = {
        type: Type.Delete,
        executor: executors.deleteBucket,
        args: ["us-east-1", "bucket1"],
        path: "aws.s3.bucket.bucket1",
        state: state.bucket1,
      };
      expect(result).toEqual([execution]);
    });

    it("should delete and create bucket when bucket is renamed", async () => {
      const bucket1Config = {
        region: "us-east-1",
        tags: { Type: "Old" },
        branch: "master",
      };
      const state: S3BucketState = {
        "bucket1": {
          createdAt: "2022-01-01T00:00:00.000Z",
          arn: "arn:aws:s3:::bucket1",
          name: "bucket1",
          dependsOn: [],
          config: bucket1Config,
        },
      };

      const config: S3BucketConfig = {
        "bucket2": {
          region: "us-east-1",
          branch: "master",
        },
      };
      const region = executors.getDefaultRegion();
      const configWithTags = mergeProjectTags(config.bucket2, projectTags);
      const configWithRegion = addDefaultRegion(configWithTags, region);

      assertBranch(configWithRegion);

      const created: CreateUnit<BucketConfig, BucketState, CreateBucket> = {
        type: Type.Create,
        executor: executors.createBucket,
        args: ["bucket2", configWithRegion],
        path: "aws.s3.bucket.bucket2",
        config: configWithRegion,
        dependsOn: [],
      };

      const deleted: DeleteUnit<BucketState, DeleteBucket> = {
        type: Type.Delete,
        executor: executors.deleteBucket,
        args: ["us-east-1", "bucket1"],
        path: "aws.s3.bucket.bucket1",
        state: state.bucket1,
      };

      const result = await createS3Plan(
        executors,
        projectTags,
        state,
        config,
      );

      expect(result).toEqual([created, deleted]);
    });
  });

  describe("noop changes on bucket", () => {
    it("when state and config are the same", async () => {
      const state: S3BucketState = {
        "bucket1": {
          createdAt: "2022-01-01T00:00:00.000Z",
          arn: "arn:aws:s3:::bucket1",
          name: "bucket1",
          dependsOn: [],
          config: {
            region: "us-east-1",
            tags: mergeTags(projectTags, { Type: "Old" }),
            branch: "master",
          },
        },
      };

      const config: S3BucketConfig = {
        "bucket1": {
          region: "us-east-1",
          branch: "master",
          tags: mergeTags(projectTags, { Type: "Old" }),
        },
      };
      const result = await createS3Plan(
        executors,
        projectTags,
        state,
        config,
      );

      const noop: NoopUnit = {
        type: Type.Noop,
        path: "aws.s3.bucket.bucket1",
        config: config.bucket1,
        state: state.bucket1,
        dependsOn: state.bucket1.dependsOn,
      };
      expect(result).toEqual([noop]);
    });
  });
});
