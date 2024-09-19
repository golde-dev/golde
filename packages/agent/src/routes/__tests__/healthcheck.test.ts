import type { Context } from "hono";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { healthcheck } from "../healthcheck.ts";

Deno.test("healthcheck", async (t) => {
  await t.step("should return status ok", () => {
    const c = {
      json: () => {},
    } as unknown as Context;

    const spyJson = spy(c, "json");

    healthcheck(c);

    assertSpyCalls(spyJson, 1);
  });
});
