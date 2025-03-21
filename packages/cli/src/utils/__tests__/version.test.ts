import { expect } from "@std/expect/expect";
import { getDirHashVersion, getFileHashVersion } from "../version.ts";
import { describe, it } from "@std/testing/bdd";
import { resolve } from "@std/path/resolve";

describe("getFileHashVersion", () => {
  it("should calculate file hash version", () => {
    const hash = getFileHashVersion(resolve(__dirname, "./__fixtures__/file.txt"));

    expect(hash).toBe("fh-sha384-8f0a6c6f121313213121");
  });
});

describe("getDirHashVersion", () => {
  it("should calculate dir hash version", () => {
    const hash = getDirHashVersion(resolve(__dirname, "./__fixtures__/dir"));
    expect(hash).toBe("dh-sha384-8f0a6c6f12131321312112xzscdqw121");
  });
});
