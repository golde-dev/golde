import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { BASE_PATH, matchHCloudServer, serverPath } from "../path.ts";

describe("matchHCloudServer", () => {
  it("should match HCloud server paths", () => {
    const examples = [
      {
        path: `${BASE_PATH}.web-1.id`,
        resourcePath: serverPath("web-1"),
        name: "web-1",
        attributePath: "id",
      },
      {
        path: `${BASE_PATH}.web-1.ipv4`,
        resourcePath: serverPath("web-1"),
        name: "web-1",
        attributePath: "ipv4",
      },
      {
        path: `${BASE_PATH}.web-1.ipv6`,
        resourcePath: serverPath("web-1"),
        name: "web-1",
        attributePath: "ipv6",
      },
      {
        path: `${BASE_PATH}.app.web-1.status`,
        resourcePath: serverPath("app.web-1"),
        name: "app.web-1",
        attributePath: "status",
      },
      {
        path: `${BASE_PATH}.web.config.serverType`,
        resourcePath: serverPath("web"),
        name: "web",
        attributePath: "config.serverType",
      },
    ];

    for (const { path, name, attributePath, resourcePath } of examples) {
      const match = matchHCloudServer(path);
      if (!match) {
        throw new Error(`Failed to match ${path}`);
      }
      const [actualResourcePath, actualName, actualAttributePath] = match;
      expect(actualResourcePath).toEqual(resourcePath);
      expect(actualName).toEqual(name);
      expect(actualAttributePath).toEqual(attributePath);
    }
  });

  it("should not match non-hcloud paths", () => {
    const examples = [
      "aws.s3.bucket.my-bucket.arn",
      "cloudflare.dns.record.golde.dev.A.www.zoneId",
    ];
    for (const path of examples) {
      expect(matchHCloudServer(path)).toBeUndefined();
    }
  });

  it("should throw when path is incorrect", () => {
    const examples = [
      `${BASE_PATH}.server`,
      `${BASE_PATH}.server.unknownAttr`,
      `${BASE_PATH}.server.config.unknownConfigField`,
    ];
    for (const path of examples) {
      expect(() => matchHCloudServer(path)).toThrow(
        `Incorrect HCloud Server path: ${path}`,
      );
    }
  });
});
