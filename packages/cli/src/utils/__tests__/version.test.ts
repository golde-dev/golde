import { expect } from "@std/expect/expect";
import { getDirHashVersion, getFileHashVersion } from "../version.ts";
import { describe, it } from "@std/testing/bdd";
import { join } from "@std/path";

describe("getFileHashVersion", () => {
  it("should calculate file hash version", async () => {
    const hash = await getFileHashVersion(
      join(import.meta.dirname ?? "", "./__fixtures__/file.txt"),
    );

    expect(hash).toBe("fh-sha384-OLBgp1GsljhM2TJ-sbHjaiH9txEUvgdDTAzHv2P24donTt6_529l-9Ua0vFImLlb");
  });
});

describe("getDirHashVersion", () => {
  it("should calculate dir hash version", async () => {
    const hash = await getDirHashVersion(
      join(import.meta.dirname ?? "", "./__fixtures__/dir"),
    );
    expect(hash).toBe("dh-sha384-q7JvGn4Ojgon-YQIyxCA4srr9mlmgHG3ZHnqb4nXvN3hBkxBLhxsp3nt7nNkXToH");
  });
});
