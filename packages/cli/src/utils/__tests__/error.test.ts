import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { getErrorMessage } from "../error.ts";

describe("getErrorMessage", () => {
  it("should return the message of an Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("should return the message of an Error subclass", () => {
    class CustomError extends Error {}
    expect(getErrorMessage(new CustomError("custom"))).toBe("custom");
  });

  it("should stringify truthy non-Error values", () => {
    expect(getErrorMessage("plain string")).toBe("plain string");
    expect(getErrorMessage(42)).toBe("42");
    expect(getErrorMessage({ code: "x" })).toBe("[object Object]");
  });

  it("should return undefined for falsy values", () => {
    expect(getErrorMessage(undefined)).toBeUndefined();
    expect(getErrorMessage(null)).toBeUndefined();
    expect(getErrorMessage("")).toBeUndefined();
  });
});
