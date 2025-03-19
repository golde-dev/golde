import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { BASE_PATH, iamRolePath, matchIAMRole } from "../path.ts";

describe("matchIamRole", () => {
  it("should match IAM Role", () => {
    const examples = [
      {
        path: `${BASE_PATH}.myRole.arn`,
        resourcePath: iamRolePath("myRole"),
        roleName: "myRole",
        attributePath: "arn",
      },
      {
        path: `${BASE_PATH}.my.Role.arn`,
        resourcePath: iamRolePath("my.Role"),
        roleName: "my.Role",
        attributePath: "arn",
      },
      {
        path: `${BASE_PATH}.myRole.config.permissionsBoundaryArn`,
        resourcePath: iamRolePath("myRole"),
        roleName: "myRole",
        attributePath: "config.permissionsBoundaryArn",
      },
    ];

    for (const { path, roleName, attributePath, resourcePath } of examples) {
      const match = matchIAMRole(path);

      if (!match) {
        throw new Error(`Failed to match ${path}`);
      }
      const [actualResourcePath, actualFunctionName, actualAttributePath] = match;
      expect(actualResourcePath).toEqual(resourcePath);
      expect(actualFunctionName).toEqual(roleName);
      expect(actualAttributePath).toEqual(attributePath);
    }
  });

  it("should not match non IAM role path", () => {
    const examples = [
      "aws.iam.user.user",
      "aws.iam.user.my-user.arn",
    ];

    for (const path of examples) {
      const match = matchIAMRole(path);
      expect(match).toBeUndefined();
    }
  });

  it("should throw when path is incorrect", () => {
    const examples = [
      `${BASE_PATH}.my.myRole`,
      `${BASE_PATH}.my.myRole.config`,
      `${BASE_PATH}.myRole.config.invalid`,
    ];

    for (const path of examples) {
      expect(() => matchIAMRole(path)).toThrow(
        `Incorrect AWS IAM role path: ${path}`,
      );
    }
  });
});
