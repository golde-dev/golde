import { describe, expect, it, vi } from "vitest";
import { gitTemplate, resolveTemplate } from "../template";
import { getBranchName, getBranchSlug } from "../git";

vi.mock("../git");

describe("resolveTemplate", () => {
  it("should return the same value if it's undefined, null, boolean, number, or bigint", () => {
    expect(resolveTemplate(undefined, vi.fn())).toBe(undefined);
    expect(resolveTemplate(null, vi.fn())).toBe(null);
    expect(resolveTemplate(true, vi.fn())).toBe(true);
    expect(resolveTemplate(42, vi.fn())).toBe(42);
    expect(resolveTemplate(BigInt(123), vi.fn())).toBe(BigInt(123));
  });

  it("should replace template placeholders in a string", () => {
    const onTemplate = vi.fn().mockReturnValue("replaced");
    expect(resolveTemplate("Hello {{name}}!", onTemplate)).toBe("Hello replaced!");
    expect(onTemplate).toHaveBeenCalledWith("name");
  });

  it("should throw an error for symbols, sets, maps and functions", () => {
    const onTemplate = vi.fn();
    expect(() => resolveTemplate(Symbol(), onTemplate)).toThrow();
    expect(() => resolveTemplate(new Set(), onTemplate)).toThrow();
    expect(() => resolveTemplate(new Map(), onTemplate)).toThrow();
    expect(() => resolveTemplate(() => {
      return;
    }, onTemplate)).toThrow();
  });

  it("should recursively resolve templates in arrays", () => {
    const onTemplate = vi.fn().mockReturnValue("resolved");
    const input = [1, "Hello {{name}}!", [true, "{{value}}"], { key: "{{key}}" }];
    const expected = [1, "Hello resolved!", [true, "resolved"], { key: "resolved" }];
    expect(resolveTemplate(input, onTemplate)).toEqual(expected);
    expect(onTemplate).toHaveBeenCalledTimes(3);
    expect(onTemplate).toHaveBeenCalledWith("name");
    expect(onTemplate).toHaveBeenCalledWith("value");
    expect(onTemplate).toHaveBeenCalledWith("key");
  });

  it("should recursively resolve templates in objects", () => {
    const onTemplate = vi.fn().mockReturnValue("resolved");
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
    expect(resolveTemplate(input, onTemplate)).toEqual(expected);
    expect(onTemplate).toHaveBeenCalledTimes(3);
    expect(onTemplate).toHaveBeenCalledWith("name");
    expect(onTemplate).toHaveBeenCalledWith("street");
    expect(onTemplate).toHaveBeenCalledWith("city");
  });

  it("should resolve templates object keys", () => {
    const onTemplate = vi.fn().mockReturnValue("resolved");
    const input = {
      "{{name}}": "name",
    };
    const expected = {
      resolved: "name",
    };
    expect(resolveTemplate(input, onTemplate)).toEqual(expected);
  });

  it("should handle multiple templates in string", () => {
    const onTemplate = vi.fn().mockImplementation((t: string): string => {
      if (t === "name") return "John";
      if (t === "surname") return "Knight";
      return t;
    });
  
    const input = {
      fullName: "{{ name }} - {{ surname }}",
    };
    const expected = {
      fullName: "John - Knight",

    };
    expect(resolveTemplate(input, onTemplate)).toEqual(expected);
  });
});

describe("gitTemplate", () => {
  it("should resolve git template variables", () => {

    vi.mocked(getBranchSlug).mockReturnValue("feature/branch");
    vi.mocked(getBranchName).mockReturnValue("main");

    const input = "This is the {{git.BRANCH_SLUG}} branch on {{git.BRANCH}}";
    const expected = "This is the feature/branch branch on main";
    expect(resolveTemplate(input, gitTemplate)).toEqual(expected);

    const input2 = {"{{git.BRANCH_SLUG}}-test": "branch on {{git.BRANCH}}" };
    const expected2 ={"feature/branch-test": "branch on main" };

    expect(resolveTemplate(input2, gitTemplate)).toEqual(expected2);
  });
});