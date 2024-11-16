import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { BASE_PATH, matchLambdaFunction } from "../path.ts";

describe("matchLambdaFunction", () => {
  it("should match function name and attribute path", () => {
    const examples = [
      {
        path: `${BASE_PATH}.myFunction`,
        functionName: "myFunction",
        attributePath: null,
      },
      {
        path: `${BASE_PATH}.myFunction.arn`,
        functionName: "myFunction",
        attributePath: "arn",
      },
      {
        path: `${BASE_PATH}.myFunction.config`,
        functionName: "myFunction",
        attributePath: "config",
      },
      {
        path: `${BASE_PATH}.my-Function.config`,
        functionName: "my-Function",
        attributePath: "config",
      },
      {
        path: `${BASE_PATH}.myFunction.config.description`,
        functionName: "myFunction",
        attributePath: "config.description",
      },
      {
        path: `${BASE_PATH}.myFunction.config.packageType`,
        functionName: "myFunction",
        attributePath: "config.packageType",
      },
    ];

    for (const { path, functionName, attributePath } of examples) {
      const match = matchLambdaFunction(path);

      if (!match) {
        throw new Error(`Failed to match ${path}`);
      }
      const [actualFunctionName, actualAttributePath] = match;
      expect(actualFunctionName).toEqual(functionName);
      expect(actualAttributePath).toEqual(attributePath);
    }
  });

  it("should not match non-lambda function path", () => {
    const examples = [
      "state.aws.iamUser.user",
      "state.aws.iamUser.user.arn",
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
      console.log(path);
      expect(() => matchLambdaFunction(path)).toThrow(
        `Incorrect AWS lambda function path: ${path}`,
      );
    }
  });
});
