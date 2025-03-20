import { assertEquals, assertThrows } from "@std/assert";
import {
  configTemplate,
  gitTemplate,
  resolveStateDependencies,
  resolveTemplate,
} from "../template.ts";
import { ConfigError } from "../../error.ts";
import type { GitInfo } from "../git.ts";
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { Type } from "@/types/plan.ts";
import type { CreateUnit } from "@/types/plan.ts";
import type { Resource, ResourceState } from "@/types/config.ts";

describe("resolveTemplate", () => {
  it(
    "should return the same value if it's undefined, null, boolean, number, or bigint",
    () => {
      const f = (t: string) => t;
      assertEquals(resolveTemplate(undefined, f), undefined);
      assertEquals(resolveTemplate(null, f), null);
      assertEquals(resolveTemplate(true, f), true);
      assertEquals(resolveTemplate(42, f), 42);
      assertEquals(resolveTemplate(BigInt(123), f), BigInt(123));
    },
  );

  it("should replace template placeholders in a string", () => {
    const onTemplate = () => "replaced";
    assertEquals(
      resolveTemplate("Hello {{name}}!", onTemplate),
      "Hello replaced!",
    );
  });

  it(
    "should throw an error for symbols, sets, maps and functions",
    () => {
      const onTemplate = (t: string) => t;
      assertThrows(() => resolveTemplate(Symbol(), onTemplate), ConfigError);
      assertThrows(() => resolveTemplate(new Set(), onTemplate), ConfigError);
      assertThrows(() => resolveTemplate(new Map(), onTemplate), ConfigError);
      assertThrows(() =>
        resolveTemplate(() => {
          return;
        }, onTemplate), ConfigError);
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
    assertEquals(resolveTemplate(input, onTemplate), expected);
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
    assertEquals(resolveTemplate(input, onTemplate), expected);
  });

  it("should resolve templates object keys", () => {
    const onTemplate = () => "resolved";
    const input = {
      "{{name}}": "name",
    };
    const expected = {
      resolved: "name",
    };
    assertEquals(resolveTemplate(input, onTemplate), expected);
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

    assertEquals(resolveTemplate(input, onTemplate), expected);
  });

  it("should resolve git template variables", () => {
    const gitInfo = {
      branchSlug: "feature/branch",
      branchName: "main",
    } as GitInfo;
    const input = "This is the {{git.BRANCH_SLUG}} branch on {{git.BRANCH_NAME}}";
    const expected = "This is the feature/branch branch on main";
    assertEquals(resolveTemplate(input, gitTemplate(gitInfo)), expected);

    const input2 = { "{{git.BRANCH_SLUG}}-test": "branch on {{git.BRANCH_NAME}}" };
    const expected2 = { "feature/branch-test": "branch on main" };

    assertEquals(resolveTemplate(input2, gitTemplate(gitInfo)), expected2);
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
    assertEquals(resolveTemplate(withGitInfo, configTemplate(managedConfig)), expected);
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
    assertEquals(resolveTemplate(input, configTemplate(managedConfig)), expected);
  });
});

describe("resolveStateDependencies", () => {
  it("should resolve dependencies for a single unit", () => {
    const dependOn = {
      statePath: "aws.s3.bucket.my-bucket.name",
      resourcePath: "aws.s3.bucket.my-bucket",
      resourceName: "my-bucket",
      resourceAttribute: "name",
    };
    const unit: CreateUnit<
      { bucketName: string } & Resource,
      { bucketName: string } & ResourceState
    > = {
      type: Type.Create,
      path: "aws.s3.object.my-object",
      args: [`{{ state.aws.s3.bucket.my-bucket.name }}`],
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
        bucketName: `{{ state.aws.s3.bucket.my-bucket.name }}`,
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
        rawConfig: {},
        branch: "master",
        dependsOn: [],
      },
    };

    const expected = {
      type: Type.Create,
      path: "aws.s3.object.my-object",
      args: [`my-bucket`],
      executor: unit.executor,
      config: {
        bucketName: `my-bucket`,
        branch: "master",
      },
      dependsOn: [
        {
          ...dependOn,
          resolved: true,
        },
      ],
    };

    expect(resolveStateDependencies(unit, [deps])).toEqual(expected);
  });

  it("should throw if state path reference is invalid", () => {
    const unit: CreateUnit<
      { bucketName: string } & Resource,
      { bucketName: string } & ResourceState
    > = {
      type: Type.Create,
      path: "aws.s3.object.my-object",
      args: [`{{ state.aws.s3.bucket.my-bucket.name }}`],
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
        bucketName: `{{ state.aws.s3.bucket.my-bucket.name }}`,
        branch: "master",
      },
      dependsOn: [
        {
          statePath: "aws.s3.bucket.my-bucket.name",
          resourcePath: "state.aws.s3.bucket.my-bucket",
          resourceName: "my-bucket",
          resourceAttribute: "name",
        },
      ],
    };

    const deps = {
      path: "state.aws.s3.bucket.my-bucket",
      type: Type.Noop,
      state: {
        differentName: "my-bucket",
        createdAt: "2022-01-01T00:00:00.000Z",
        branch: "master",
        dependsOn: [],
        config: {},
        rawConfig: {},
      },
    };

    expect(() => resolveStateDependencies(unit, [deps])).toThrow(
      "Failed to resolve unit aws.s3.object.my-object dependency on state.aws.s3.bucket.my-bucket, attribute name is missing",
    );
  });
});
