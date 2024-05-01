import { assertEquals, assertThrows } from "@std/assert";
// import { stub } from "@std/testing/mock";
import { resolveTemplate } from "../template.ts";
// import * as git from "../git.ts";
import { ConfigError } from "../../error.ts";

Deno.test("resolveTemplate", async (t) => {
  await t.step(
    "should return the same value if it's undefined, null, boolean, number, or bigint",
    () => {
      const f = (t: string) => t;
      assertEquals(resolveTemplate(undefined, f), undefined);
      assertEquals(resolveTemplate(null, f), null);
      assertEquals(resolveTemplate(true, f), true);
      assertEquals(resolveTemplate(42, f), 42);
      assertEquals(resolveTemplate(BigInt(123), f), BigInt(123));
    },
  );

  await t.step("should replace template placeholders in a string", () => {
    const onTemplate = () => "replaced";
    assertEquals(
      resolveTemplate("Hello {{name}}!", onTemplate),
      "Hello replaced!",
    );
  });

  await t.step(
    "should throw an error for symbols, sets, maps and functions",
    () => {
      const onTemplate = (t: string) => t;
      assertThrows(() => resolveTemplate(Symbol(), onTemplate), ConfigError);
      assertThrows(() => resolveTemplate(new Set(), onTemplate), ConfigError);
      assertThrows(() => resolveTemplate(new Map(), onTemplate), ConfigError);
      assertThrows(() =>
        resolveTemplate(() => {
          return;
        }, onTemplate), ConfigError);
    },
  );

  await t.step("should recursively resolve templates in arrays", () => {
    const onTemplate = () => "resolved";
    const input = [1, "Hello {{name}}!", [true, "{{value}}"], {
      key: "{{key}}",
    }];
    const expected = [1, "Hello resolved!", [true, "resolved"], {
      key: "resolved",
    }];
    assertEquals(resolveTemplate(input, onTemplate), expected);
  });

  await t.step("should recursively resolve templates in objects", () => {
    const onTemplate = () => "resolved";
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
    assertEquals(resolveTemplate(input, onTemplate), expected);
  });

  await t.step("should resolve templates object keys", () => {
    const onTemplate = () => "resolved";
    const input = {
      "{{name}}": "name",
    };
    const expected = {
      resolved: "name",
    };
    assertEquals(resolveTemplate(input, onTemplate), expected);
  });

  await t.step("should handle multiple templates in string", () => {
    const onTemplate = (t: string): string => {
      if (t === "name") return "John";
      if (t === "surname") return "Knight";
      return t;
    };

    const input = {
      fullName: "{{ name }} - {{ surname }}",
    };
    const expected = {
      fullName: "John - Knight",
    };
    assertEquals(resolveTemplate(input, onTemplate), expected);
  });

  // await t.step("should resolve git template variables", () => {
  //   stub(git, "getBranchSlug", () => "feature/branch");
  //   stub(git, "getBranchName", () => "main");

  //   const input = "This is the {{git.BRANCH_SLUG}} branch on {{git.BRANCH}}";
  //   const expected = "This is the feature/branch branch on main";
  //   assertEquals(resolveTemplate(input, gitTemplate), expected);

  //   const input2 = { "{{git.BRANCH_SLUG}}-test": "branch on {{git.BRANCH}}" };
  //   const expected2 = { "feature/branch-test": "branch on main" };

  //   assertEquals(resolveTemplate(input2, gitTemplate), expected2);
  // });
});
