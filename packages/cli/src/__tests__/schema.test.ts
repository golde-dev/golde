import { validateConfig } from "../schema";
import { ConfigError } from "../error";
import { describe, expect, it } from "vitest";
import type { Config } from "../types/config";

describe("validateConfig", () => {
  describe("project", () => {
    it("should throw an error if the config is invalid", () => {
      const invalidConfig: Config = {
        project: "invalid project name",
        providers: {
          deployer: {
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
        project: "valid_project_name",
        providers: {
          deployer: {
            apiKey: "valid_api_key",
          },
        },
      };

      expect(() => {
        validateConfig(validConfig); 
      }).not.toThrow();
    });

  });
});