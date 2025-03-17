import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { BASE_PATH, matchS3Bucket, s3BucketPath } from "../path.ts";

describe("matchS3Bucket", () => {
  it("should match S3 bucket", () => {
    const examples = [
      {
        path: `${BASE_PATH}.my-bucket.arn`,
        resourcePath: s3BucketPath("my-bucket"),
        bucketName: "my-bucket",
        attributePath: "arn",
      },
      {
        path: `${BASE_PATH}.my.my-bucket.arn`,
        resourcePath: s3BucketPath("my.my-bucket"),
        bucketName: "my.my-bucket",
        attributePath: "arn",
      },
      {
        path: `${BASE_PATH}.my.bucket.arn.arn`,
        resourcePath: s3BucketPath("my.bucket.arn"),
        bucketName: "my.bucket.arn",
        attributePath: "arn",
      },
      {
        path: `${BASE_PATH}.bucket.config.region`,
        resourcePath: s3BucketPath("bucket"),
        bucketName: "bucket",
        attributePath: "config.region",
      },
    ];

    for (const { path, bucketName, attributePath, resourcePath } of examples) {
      const match = matchS3Bucket(path);

      if (!match) {
        throw new Error(`Failed to match ${path}`);
      }
      const [actualResourcePath, actualBucketName, actualAttributePath] = match;
      expect(actualResourcePath).toEqual(resourcePath);
      expect(actualBucketName).toEqual(bucketName);
      expect(actualAttributePath).toEqual(attributePath);
    }
  });

  it("should not match non s3 bucket path", () => {
    const examples = [
      "aws.iam.user.user",
      "aws.iam.user.user.arn",
    ];

    for (const path of examples) {
      const match = matchS3Bucket(path);
      expect(match).toBeUndefined();
    }
  });

  it("should throw when path is incorrect", () => {
    const examples = [
      `${BASE_PATH}.bucket`,
      `${BASE_PATH}.my.bucket.config`,
      `${BASE_PATH}.myRole.config.invalid`,
    ];

    for (const path of examples) {
      expect(() => matchS3Bucket(path)).toThrow(
        `Incorrect AWS Bucket path: ${path}`,
      );
    }
  });
});
