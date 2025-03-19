import { expect } from "@std/expect/expect";
import { getOutputLength } from "../hash.ts";
import { describe, it } from "@std/testing/bdd";

describe("getOutputLength", () => {
  it("should calculate minimum output length based on input length", () => {
    const inputLength = 1024 * 1024;
    const outputLength = getOutputLength(inputLength);
    expect(outputLength).toEqual(24);

    const inputLength2 = 10_000 * 1024 * 1024;
    const outputLength2 = getOutputLength(inputLength2);
    expect(outputLength2).toEqual(50);
  });
});
