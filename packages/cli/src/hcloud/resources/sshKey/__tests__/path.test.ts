import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { BASE_PATH, matchHCloudSSHKey, sshKeyPath } from "../path.ts";

describe("matchHCloudSSHKey", () => {
  it("should match HCloud ssh key paths", () => {
    const examples = [
      {
        path: `${BASE_PATH}.deploy-key.id`,
        resourcePath: sshKeyPath("deploy-key"),
        name: "deploy-key",
        attributePath: "id",
      },
      {
        path: `${BASE_PATH}.deploy-key.name`,
        resourcePath: sshKeyPath("deploy-key"),
        name: "deploy-key",
        attributePath: "name",
      },
      {
        path: `${BASE_PATH}.deploy-key.fingerprint`,
        resourcePath: sshKeyPath("deploy-key"),
        name: "deploy-key",
        attributePath: "fingerprint",
      },
      {
        path: `${BASE_PATH}.deploy-key.publicKey`,
        resourcePath: sshKeyPath("deploy-key"),
        name: "deploy-key",
        attributePath: "publicKey",
      },
      {
        path: `${BASE_PATH}.team.deploy-key.createdAt`,
        resourcePath: sshKeyPath("team.deploy-key"),
        name: "team.deploy-key",
        attributePath: "createdAt",
      },
      {
        path: `${BASE_PATH}.deploy-key.config.branch`,
        resourcePath: sshKeyPath("deploy-key"),
        name: "deploy-key",
        attributePath: "config.branch",
      },
    ];

    for (const { path, name, attributePath, resourcePath } of examples) {
      const match = matchHCloudSSHKey(path);
      if (!match) {
        throw new Error(`Failed to match ${path}`);
      }
      const [actualResourcePath, actualName, actualAttributePath] = match;
      expect(actualResourcePath).toEqual(resourcePath);
      expect(actualName).toEqual(name);
      expect(actualAttributePath).toEqual(attributePath);
    }
  });

  it("should not match non-sshKey paths", () => {
    const examples = [
      "hcloud.server.web-1.id",
      "aws.s3.bucket.my-bucket.arn",
      "cloudflare.dns.record.golde.dev.A.www.zoneId",
    ];
    for (const path of examples) {
      expect(matchHCloudSSHKey(path)).toBeUndefined();
    }
  });

  it("should throw when path is incorrect", () => {
    const examples = [
      `${BASE_PATH}.key`,
      `${BASE_PATH}.key.unknownAttr`,
      `${BASE_PATH}.key.config.unknownConfigField`,
    ];
    for (const path of examples) {
      expect(() => matchHCloudSSHKey(path)).toThrow(
        `Incorrect HCloud SSH Key path: ${path}`,
      );
    }
  });
});
