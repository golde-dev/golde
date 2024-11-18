import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { BASE_PATH, lambdaFunctionPath, matchLambdaFunction } from "../path.ts";

describe("matchLambdaFunction", () => {
  it("should match function name and attribute path", () => {
    const examples = [
      {
        path: `${BASE_PATH}.myFunction`,
        resourcePath: lambdaFunctionPath("myFunction"),
        functionName: "myFunction",
        attributePath: null,
      },
      {
        path: `${BASE_PATH}.myFunction.arn`,
        resourcePath: lambdaFunctionPath("myFunction"),
        functionName: "myFunction",
        attributePath: "arn",
      },
      {
        path: `${BASE_PATH}.myFunction.config`,
        resourcePath: lambdaFunctionPath("myFunction"),
        functionName: "myFunction",
        attributePath: "config",
      },
      {
        path: `${BASE_PATH}.my-Function.config`,
        resourcePath: lambdaFunctionPath("my-Function"),
        functionName: "my-Function",
        attributePath: "config",
      },
      {
        path: `${BASE_PATH}.myFunction.config.description`,
        resourcePath: lambdaFunctionPath("myFunction"),
        functionName: "myFunction",
        attributePath: "config.description",
      },
      {
        path: `${BASE_PATH}.myFunction.config.packageType`,
        resourcePath: lambdaFunctionPath("myFunction"),
        functionName: "myFunction",
        attributePath: "config.packageType",
      },
    ];

    for (const { path, functionName, attributePath, resourcePath } of examples) {
      const match = matchLambdaFunction(path);

      if (!match) {
        throw new Error(`Failed to match ${path}`);
      }
      const [actualResourcePath, actualFunctionName, actualAttributePath] = match;
      expect(actualResourcePath).toEqual(resourcePath);
      expect(actualFunctionName).toEqual(functionName);
      expect(actualAttributePath).toEqual(attributePath);
    }
  });

  it("should not match non-lambda function path", () => {
    const examples = [
      "aws.iamUser.user",
      "aws.iamUser.user.arn",
    ];

    for (const path of examples) {
      const match = matchLambdaFunction(path);
      expect(match).toBeUndefined();
    }
  });

  it("should throw when path is incorrect", () => {
    const examples = [
      `${BASE_PATH}.my.Function`,
      `${BASE_PATH}.my.Function.config`,
      `${BASE_PATH}.myFunction.config.invalid`,
    ];

    for (const path of examples) {
      expect(() => matchLambdaFunction(path)).toThrow(
        `Incorrect AWS lambda function path: ${path}`,
      );
    }
  });
});
