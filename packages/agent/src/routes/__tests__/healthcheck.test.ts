import type { Context } from "hono";
import { assertSpyCall, spy } from "@std/testing/mock";
import { healthcheck } from "../healthcheck.ts";

Deno.test("healthcheck", async (t) => {
  await t.step("should return status ok", () => {
    const json = spy();
    const c = {
      json,
    } as unknown as Context;

    healthcheck(c);

    assertSpyCall(json, 0, {
      args: [{ status: "ok" }],
    });
  });
});
