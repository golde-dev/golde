import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { FSStateClient } from "../fsState.ts";

describe("FSStateClient outputs", () => {
  const stateDir = ".golde-test-outputs";
  const client = new FSStateClient(stateDir);

  afterAll(() => {
    rmSync(join(cwd(), stateDir), { recursive: true, force: true });
  });

  it("should return empty outputs when none were saved", async () => {
    await client.ensureLocation();
    expect(await client.getOutputs("project", "master")).toEqual({});
  });

  it("should roundtrip saved outputs per branch", async () => {
    await client.ensureLocation();
    const outputs = { apiUrl: "https://api.example.com" };

    await client.saveOutputs("project", "feature/one", outputs);

    expect(await client.getOutputs("project", "feature/one")).toEqual(outputs);
    expect(await client.getOutputs("project", "master")).toEqual({});
  });
});
