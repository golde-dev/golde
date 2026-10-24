import { describe, expect, it } from "vitest";
import { configTemplate, gitTemplate, resolveTemplate, resolveUnitState } from "../template.ts";
import { ConfigError } from "../../error.ts";
import { Type } from "#/types/plan.ts";
import type { GitInfo } from "../git.ts";
import type { CreateUnit } from "#/types/plan.ts";
import type { ResourceConfig, ResourceState } from "#/types/config.ts";

describe("resolveTemplate", () => {
  it(
    "should return the same value if it's undefined, null, boolean, number, or bigint",
    () => {
      const f = (t: string) => t;
      expect(resolveTemplate(undefined, f)).toEqual(undefined);
      expect(resolveTemplate(null, f)).toEqual(null);
      expect(resolveTemplate(true, f)).toEqual(true);
      expect(resolveTemplate(42, f)).toEqual(42);
      expect(resolveTemplate(BigInt(123), f)).toEqual(BigInt(123));
    },
  );

  it("should replace template placeholders in a string", () => {
    const onTemplate = () => "replaced";
    expect(resolveTemplate("Hello {{name}}!", onTemplate)).toBe("Hello replaced!");
  });

  it(
    "should throw an error for symbols, sets, maps and functions",
    () => {
      const onTemplate = (t: string) => t;
      expect(() => resolveTemplate(Symbol(), onTemplate)).toThrow(ConfigError);
      expect(() => resolveTemplate(new Set(), onTemplate)).toThrow(ConfigError);
      expect(() => resolveTemplate(new Map(), onTemplate)).toThrow(ConfigError);
      expect(() =>
        resolveTemplate(() => {
          return;
        }, onTemplate)
      ).toThrow(ConfigError);
    },
  );

  it("should recursively resolve templates in arrays", () => {
    const onTemplate = () => "resolved";
    const input = [1, "Hello {{name}}!", [true, "{{value}}"], {
      key: "{{key}}",
    }];
    const expected = [1, "Hello resolved!", [true, "resolved"], {
      key: "resolved",
    }];
    expect(resolveTemplate(input, onTemplate)).toEqual(expected);
  });

  it("should recursively resolve templates in objects", () => {
    const onTemplate = () => "resolved";
    const input = {
      name: "{{name}}",
      age: 42,
      address: {
        street: "{{street}}",
        city: "{{city}}",
      },
    };
    const expected = {
      name: "resolved",
      age: 42,
      address: {
        street: "resolved",
        city: "resolved",
      },
    };
    expect(resolveTemplate(input, onTemplate)).toEqual(expected);
  });

  it("should resolve templates object keys", () => {
    const onTemplate = () => "resolved";
    const input = {
      "{{name}}": "name",
    };
    const expected = {
      resolved: "name",
    };
    expect(resolveTemplate(input, onTemplate)).toEqual(expected);
  });

  it("should handle multiple templates in strings", () => {
    const onTemplate = (t: string): string => {
      if (t === "name") return "John";
      if (t === "surname") return "Knight";
      return t;
    };

    const input = {
      fullName: "{{ name }} - {{ surname }}",
    };
    const expected = {
      fullName: "John - Knight",
    };

    expect(resolveTemplate(input, onTemplate)).toEqual(expected);
  });

  it("should resolve git template variables", () => {
    const gitInfo = {
      branchSlug: "feature/branch",
      branchName: "main",
    } as GitInfo;
    const input = "This is the {{git.BRANCH_SLUG}} branch on {{git.BRANCH_NAME}}";
    const expected = "This is the feature/branch branch on main";
    expect(resolveTemplate(input, gitTemplate(gitInfo))).toEqual(expected);

    const input2 = { "{{git.BRANCH_SLUG}}-test": "branch on {{git.BRANCH_NAME}}" };
    const expected2 = { "feature/branch-test": "branch on main" };

    expect(resolveTemplate(input2, gitTemplate(gitInfo))).toEqual(expected2);
  });

  it("should resolve nested config template variables", () => {
    const managedConfig = {
      "branch": "feature/branch",
      "name-main": "John",
      "age": 42,
      "boolean": true,
    };
    const gitInfo = {
      branchSlug: "main",
      branchName: "main",
    } as GitInfo;

    const input = {
      "fullName": "test-{{config.name-{{ git.BRANCH_NAME }}}}-end",
      "age": "{{config.age}}",
      "boolean": "{{config.boolean}}",
    };
    const expected = {
      "fullName": "test-John-end",
      "age": 42,
      "boolean": true,
    };
    const withGitInfo = resolveTemplate(input, gitTemplate(gitInfo));
    expect(resolveTemplate(withGitInfo, configTemplate(managedConfig))).toEqual(expected);
  });

  it("should resolve managed config template variables of different types", () => {
    const managedConfig = {
      "branch": "feature/branch",
      "name": "John",
      "age": 42,
      "boolean": true,
    };

    const input = {
      "fullName": "{{config.name}} - {{config.name}}",
      "age": "{{config.age}}",
      "boolean": "{{config.boolean}}",
    };
    const expected = {
      "fullName": "John - John",
      "age": 42,
      "boolean": true,
    };
    expect(resolveTemplate(input, configTemplate(managedConfig))).toEqual(expected);
  });
});

describe("resolveStateDependencies", () => {
  it("should resolve dependencies for a single unit", () => {
    const dependOn = {
      valuePath: "aws.s3.bucket.my-bucket.name",
      resourcePath: "aws.s3.bucket.my-bucket",
      resourceName: "my-bucket",
      resourceAttribute: "name",
    };
    const unit: CreateUnit<
      { bucketName: string } & ResourceConfig,
      { bucketName: string } & ResourceState
    > = {
      type: Type.Create,
      path: "aws.s3.object.my-object",
      args: [
        `{{ resources.aws.s3.bucket.my-bucket.name }}`,
        {
          bucketName: "{{ resources.aws.s3.bucket.my-bucket.name }}",
        },
      ],
      executor: (bucketName: string) =>
        Promise.resolve({
          bucketName,
          config: {
            bucketName,
            branch: "master",
          },
          dependsOn: [],
        }),
      config: {
        bucketName: `{{ resources.aws.s3.bucket.my-bucket.name }}`,
        branch: "master",
      },
      dependsOn: [dependOn],
    };

    const deps = {
      path: "aws.s3.bucket.my-bucket",
      type: Type.Noop,
      state: {
        name: "my-bucket",
        createdAt: "2022-01-01T00:00:00.000Z",
        config: {},
        branch: "master",
        dependsOn: [],
      },
    };

    const expected = {
      type: Type.Create,
      path: "aws.s3.object.my-object",
      args: [`my-bucket`, { bucketName: "my-bucket" }],
      executor: unit.executor,
      config: {
        bucketName: "my-bucket",
        branch: "master",
      },
      dependsOn: [dependOn],
    };

    expect(resolveUnitState(unit, [deps])).toEqual(expected);
  });

  it("should throw if resources path reference is invalid", () => {
    const unit: CreateUnit<
      { bucketName: string } & ResourceConfig,
      { bucketName: string } & ResourceState
    > = {
      type: Type.Create,
      path: "aws.s3.object.my-object",
      args: [`{{ resources.aws.s3.bucket.my-bucket.invalid }}`],
      executor: (bucketName: string) =>
        Promise.resolve({
          bucketName,
          config: {
            bucketName,
            branch: "master",
          },
          dependsOn: [],
        }),
      config: {
        bucketName: `{{ resources.aws.s3.bucket.my-bucket.invalid }}`,
        branch: "master",
      },
      dependsOn: [
        {
          valuePath: "aws.s3.bucket.my-bucket.name",
          resourcePath: "resources.aws.s3.bucket.my-bucket",
          resourceName: "my-bucket",
          resourceAttribute: "name",
        },
      ],
    };

    const deps = {
      path: "resources.aws.s3.bucket.my-bucket",
      type: Type.Noop,
      state: {
        differentName: "my-bucket",
        createdAt: "2022-01-01T00:00:00.000Z",
        branch: "master",
        dependsOn: [],
        config: {},
      },
    };

    expect(() => resolveUnitState(unit, [deps])).toThrow(
      "Incorrect AWS Bucket path: aws.s3.bucket.my-bucket.invalid",
    );
  });
});
