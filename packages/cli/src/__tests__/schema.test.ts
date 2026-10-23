import { validateConfig } from "../schema.ts";
import { ConfigError } from "../error.ts";
import type { Config } from "../types/config.ts";
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { parse as parseYaml } from "@std/yaml";

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

    expect(validateConfig(validConfig)).toEqual(validConfig);
  });
});

describe("validateConfig for outputs", () => {
  it("should accept outputs as a record of template strings", () => {
    const config = {
      name: "project",
      outputs: {
        apiUrl: "{{ resources.aws.appRunner.api.url }}",
        bucketArn: "{{ resources.aws.s3.assets.arn }}",
      },
    };

    expect(validateConfig(config)).toEqual(config);
  });

  it("should reject non-string output values", () => {
    const config = {
      name: "project",
      outputs: {
        slack: {
          channel: {
            message: {
              deploy: { channel: "#infra", text: "deployed" },
            },
          },
        },
      },
    };

    expect(() => validateConfig(config)).toThrow(ConfigError);
  });
});

describe("validateConfig for on hooks", () => {
  it("should accept all events and action types", () => {
    const config = {
      name: "project",
      on: {
        success: [
          {
            discord: {
              webhook: "https://discord.com/api/webhooks/x",
              message: "✅ {{ git.BRANCH_NAME }} → {{ outputs.apiUrl }}",
            },
            branch: "master",
          },
          {
            slack: { channel: "#infra", text: "{{ run.status }}" },
            branchPattern: "feature/.*",
          },
        ],
        failure: [
          {
            webhook: {
              url: "https://ops.example.com/hook",
              method: "PUT",
              headers: { "X-Token": "abc" },
              body: "{{ run.error }}",
            },
          },
        ],
        changed: [],
        unchanged: [],
        destroy: [],
        prune: [],
      },
    };

    expect(validateConfig(config)).toEqual(config);
  });

  it("should reject unknown action types", () => {
    const config = {
      name: "project",
      on: {
        success: [{ telegram: { chat: "x", message: "y" } }],
      },
    };

    expect(() => validateConfig(config)).toThrow(ConfigError);
  });

  it("should reject unknown events", () => {
    const config = {
      name: "project",
      on: {
        onSuccess: [{ discord: { webhook: "x", message: "y" } }],
      },
    };

    expect(() => validateConfig(config)).toThrow(ConfigError);
  });

  it("should parse the on key from YAML as a string key", () => {
    const yaml = `
name: project
on:
  success:
    - discord:
        webhook: https://discord.example.com/webhook
        message: deployed
`;
    const config = validateConfig(parseYaml(yaml));

    expect(config.on?.success).toHaveLength(1);
  });
});
