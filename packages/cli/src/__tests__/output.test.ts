import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { buildRunInfo, resolveOutputs, summarizeChanges } from "../output.ts";
import { Type } from "../types/plan.ts";
import type { Change } from "../types/plan.ts";

const resources = [
  {
    path: "aws.s3.bucket.assets",
    createdAt: "2026-01-01T00:00:00.000Z",
    state: {
      name: "assets-bucket",
      config: {},
      dependsOn: [],
    },
  },
  {
    path: "aws.s3.object.bundle",
    version: "v2",
    isCurrent: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    state: {
      key: "bundle-v2.zip",
      config: {},
      dependsOn: [],
    },
  },
  {
    path: "aws.s3.object.bundle",
    version: "v1",
    isCurrent: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    state: {
      key: "bundle-v1.zip",
      config: {},
      dependsOn: [],
    },
  },
];

describe("resolveOutputs", () => {
  it("should resolve outputs against resource state", () => {
    const outputs = {
      bucketName: "{{ resources.aws.s3.bucket.assets.name }}",
      static: "plain-value",
    };

    expect(resolveOutputs(outputs, resources)).toEqual({
      bucketName: "assets-bucket",
      static: "plain-value",
    });
  });

  it("should resolve versioned resources to the current version", () => {
    const outputs = {
      bundleKey: "{{ resources.aws.s3.object.bundle.key }}",
    };

    expect(resolveOutputs(outputs, resources)).toEqual({
      bundleKey: "bundle-v2.zip",
    });
  });

  it("should keep raw template for unresolvable outputs", () => {
    const outputs = {
      missing: "{{ resources.aws.s3.bucket.unknown.name }}",
    };

    expect(resolveOutputs(outputs, resources)).toEqual({
      missing: "{{ resources.aws.s3.bucket.unknown.name }}",
    });
  });

  it("should keep raw template when resolution throws", () => {
    const outputs = {
      invalid: "{{ resources.aws.s3.bucket.assets.invalid }}",
    };

    expect(resolveOutputs(outputs, resources)).toEqual({
      invalid: "{{ resources.aws.s3.bucket.assets.invalid }}",
    });
  });

  it("should return empty record when no outputs defined", () => {
    expect(resolveOutputs(undefined, resources)).toEqual({});
  });
});

describe("summarizeChanges", () => {
  const change = (type: Change["type"]): Change =>
    ({ type, path: "aws.s3.bucket.x", state: {}, executionTime: 1 }) as Change;

  it("should group change types into a summary", () => {
    const changes = [
      change(Type.Create),
      change(Type.CreateVersion),
      change(Type.Update),
      change(Type.Delete),
    ];

    expect(summarizeChanges(changes)).toBe("2 created, 1 updated, 1 deleted");
  });

  it("should report no changes for an empty changeset", () => {
    expect(summarizeChanges([])).toBe("no changes");
  });

  it("should include version changes", () => {
    expect(summarizeChanges([change(Type.ChangeVersion)])).toBe("1 version changed");
  });
});

describe("buildRunInfo", () => {
  it("should build run info with a change summary", () => {
    const changes: Change[] = [
      { type: Type.Create, path: "aws.s3.bucket.x", state: {}, executionTime: 1 } as Change,
    ];
    const run = buildRunInfo("apply", "success", performance.now(), changes);

    expect(run.status).toBe("success");
    expect(run.command).toBe("apply");
    expect(run.changes).toBe("1 created");
    expect(run.error).toBeUndefined();
    expect(run.duration).toMatch(/\d/);
  });

  it("should extract the error message on failure", () => {
    const run = buildRunInfo(
      "apply",
      "failure",
      performance.now(),
      [],
      new Error("boom"),
    );

    expect(run.status).toBe("failure");
    expect(run.error).toBe("boom");
    expect(run.changes).toBe("no changes");
  });
});
