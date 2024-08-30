import { validateConfig } from "../schema.ts";
import { ConfigError } from "../error.ts";
import { assertEquals, assertThrows } from "@std/assert";
import type { Config } from "../types/config.ts";

Deno.test("validateConfig for project", async (t) => {
  await t.step("should throw an error if the config is invalid", () => {
    const invalidConfig: Config = {
      name: "invalid project name",
      providers: {
        golde: {
          apiKey: "valid_api_key",
        },
      },
    };

    assertThrows(() => {
      validateConfig(invalidConfig);
    }, ConfigError);
  });

  await t.step("should not throw an error if the config is valid", () => {
    const validConfig = {
      name: "valid_project_name",
      providers: {
        golde: {
          apiKey: "valid_api_key",
        },
      },
    };

    assertEquals(validateConfig(validConfig), undefined);
  });
});
