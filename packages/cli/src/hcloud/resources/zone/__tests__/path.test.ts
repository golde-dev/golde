import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { BASE_PATH, matchHCloudZone, zonePath } from "../path.ts";

describe("matchHCloudZone", () => {
  it("matches zone state attributes", () => {
    const examples = [
      {
        path: `${BASE_PATH}.golde.dev.id`,
        resourcePath: zonePath("golde.dev"),
        name: "golde.dev",
        attributePath: "id",
      },
      {
        path: `${BASE_PATH}.golde.dev.name`,
        resourcePath: zonePath("golde.dev"),
        name: "golde.dev",
        attributePath: "name",
      },
      {
        path: `${BASE_PATH}.golde.dev.mode`,
        resourcePath: zonePath("golde.dev"),
        name: "golde.dev",
        attributePath: "mode",
      },
      {
        path: `${BASE_PATH}.golde.dev.ttl`,
        resourcePath: zonePath("golde.dev"),
        name: "golde.dev",
        attributePath: "ttl",
      },
      {
        path: `${BASE_PATH}.golde.dev.config.branch`,
        resourcePath: zonePath("golde.dev"),
        name: "golde.dev",
        attributePath: "config.branch",
      },
    ];
    for (const { path, name, attributePath, resourcePath } of examples) {
      const match = matchHCloudZone(path);
      if (!match) throw new Error(`Failed to match ${path}`);
      const [actualResourcePath, actualName, actualAttributePath] = match;
      expect(actualResourcePath).toEqual(resourcePath);
      expect(actualName).toEqual(name);
      expect(actualAttributePath).toEqual(attributePath);
    }
  });

  it("does not match non-zone paths", () => {
    const examples = [
      "hcloud.server.web-1.id",
      "hcloud.sshKey.deploy-key.name",
      "hcloud.dns.record.golde.dev.A.www.zoneName",
    ];
    for (const path of examples) {
      expect(matchHCloudZone(path)).toBeUndefined();
    }
  });

  it("throws on incorrect path", () => {
    const examples = [
      `${BASE_PATH}.golde`,
      `${BASE_PATH}.golde.dev.unknownAttr`,
      `${BASE_PATH}.golde.dev.config.unknownConfigField`,
    ];
    for (const path of examples) {
      expect(() => matchHCloudZone(path)).toThrow(
        `Incorrect HCloud Zone path: ${path}`,
      );
    }
  });
});
