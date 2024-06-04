import { Context } from "hono";
import { assertSpyCalls, spy } from "@std/testing/mock";
import healthcheck from "../healthcheck.ts";

Deno.test("healthcheck", (t) => {
  t.step("should return status ok", () => {
    const spyJson = spy();
    const c = {
      json: spy,
    } as unknown as Context;

    healthcheck(c);

    assertSpyCalls(spyJson, 1);
  });
});
