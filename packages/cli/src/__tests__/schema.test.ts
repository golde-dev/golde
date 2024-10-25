import { validateConfig } from "../schema.ts";
import { ConfigError } from "../error.ts";
import type { Config } from "../types/config.ts";
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";

describe("validateConfig for project", () => {
  it("should throw an error if the config is invalid", () => {
    const invalidConfig: Config = {
      name: "invalid project name",
      providers: {
        golde: {
          apiKey: "valid_api_key",
        },
      },
    };

    expect(() => {
      validateConfig(invalidConfig);
    }).toThrow(ConfigError);
  });

  it("should not throw an error if the config is valid", () => {
    const validConfig = {
      name: "valid_project_name",
      providers: {
        golde: {
          apiKey: "valid_api_key",
        },
      },
    };

    expect(validateConfig(validConfig)).toBeUndefined();
  });
});
