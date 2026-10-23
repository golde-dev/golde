import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { logger } from "../logger.ts";
import { executePlan, updateState } from "../apply.ts";

// pino writes asynchronously and trips the op sanitizer across test boundaries
logger.error = () => {};
logger.debug = () => {};
import { Type } from "../types/plan.ts";
import type { Context } from "../types/context.ts";
import type { CreateUnit } from "../types/plan.ts";
import type { AbstractStateClient } from "../types/state.ts";

describe("executePlan failures", () => {
  it("should propagate executor errors instead of exiting", async () => {
    const unit: CreateUnit = {
      type: Type.Create,
      path: "aws.s3.bucket.broken",
      args: [],
      executor: () => Promise.reject(new Error("executor blew up")),
      config: {},
      dependsOn: [],
    };

    await expect(executePlan([unit], [unit])).rejects.toThrow("executor blew up");
  });
});

describe("updateState failures", () => {
  it("should propagate state backend errors instead of exiting", async () => {
    const context = {
      config: { name: "project" },
      git: { branchName: "master" },
      state: {
        applyChanges: () => Promise.reject(new Error("state backend down")),
      } as unknown as AbstractStateClient,
    } as Context;

    await expect(updateState(context, [], [])).rejects.toThrow("state backend down");
  });
});
