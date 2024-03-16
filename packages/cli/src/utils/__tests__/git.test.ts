import {execSync} from "child_process";
import {describe, expect, it, vi} from "vitest";
import {getBranchSlug} from "../git";

vi.mock("child_process");

describe("getBranchSlug", () => {
  it("replace spaces and slashes and transform to dashes", () => {
    vi.mocked(execSync).mockReturnValue("feature/#MAP-1-example-branch");

    expect(getBranchSlug()).toBe("feature-#MAP-1-example-branch");
  });
});