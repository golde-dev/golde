import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { BASE_PATH, cloudwatchLogGroupPath, matchCloudwatchLogGroup } from "../path.ts";

describe("matchIamRole", () => {
  it("should match cloudwatch log group path", () => {
    const examples = [
      {
        path: `${BASE_PATH}.my-group`,
        resourcePath: cloudwatchLogGroupPath("my-group"),
        name: "my-group",
        attributePath: null,
      },
      {
        path: `${BASE_PATH}.myGroup.arn`,
        resourcePath: cloudwatchLogGroupPath("myGroup"),
        name: "myGroup",
        attributePath: "arn",
      },
      {
        path: `${BASE_PATH}['my.Group'].arn`,
        resourcePath: cloudwatchLogGroupPath("my.Group"),
        name: "my.Group",
        attributePath: "arn",
      },
      {
        path: `${BASE_PATH}.myGroup.name`,
        resourcePath: cloudwatchLogGroupPath("myGroup"),
        name: "myGroup",
        attributePath: "name",
      },
      {
        path: `aws.cloudwatchLogGroup./aws/lambda/example-aws-lambda-function-log-group.name`,
        resourcePath: cloudwatchLogGroupPath("/aws/lambda/example-aws-lambda-function-log-group"),
        name: "/aws/lambda/example-aws-lambda-function-log-group",
        attributePath: "name",
      },
    ];

    for (const { path, name, attributePath, resourcePath } of examples) {
      const match = matchCloudwatchLogGroup(path);

      if (!match) {
        throw new Error(`Failed to match ${path}`);
      }
      const [actualResourcePath, actualName, actualAttributePath] = match;
      expect(actualResourcePath).toEqual(resourcePath);
      expect(actualName).toEqual(name);
      expect(actualAttributePath).toEqual(attributePath);
    }
  });

  it("should not match non cloudwatch log group path", () => {
    const examples = [
      "aws.iamUser.user",
      "aws.iamUser.user.arn",
    ];

    for (const path of examples) {
      const match = matchCloudwatchLogGroup(path);
      expect(match).toBeUndefined();
    }
  });
});
