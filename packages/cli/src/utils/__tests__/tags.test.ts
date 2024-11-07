import { describe, it } from "@std/testing/bdd";
import { mergeTags } from "../tags.ts";
import { expect } from "@std/expect/expect";

describe("tags", () => {
  describe("mergeTags", () => {
    it("should merge tags", () => {
      const tags = {
        "ProjectCode": "my-project",
        "Environment": "production",
      };
      const other = {
        "Environment": "staging",
      };

      const result = mergeTags(tags, other);
      expect(result).toEqual({
        "ProjectCode": "my-project",
        "Environment": "staging",
      });
    });

    it("should return undefined if both are undefined", () => {
      const result = mergeTags(undefined, undefined);
      expect(result).toBeUndefined();
    });

    it("should return tags if other is undefined", () => {
      const tags = {
        "ProjectCode": "my-project",
        "Environment": "production",
      };

      const result = mergeTags(tags, undefined);
      expect(result).toEqual(tags);
    });

    it("should return other if tags is undefined", () => {
      const other = {
        "Environment": "staging",
      };

      const result = mergeTags(undefined, other);
      expect(result).toEqual(other);
    });
  });
});
