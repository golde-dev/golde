import { describe, expect, it, vi } from "vitest";
import { resolveTemplate } from "../template";

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