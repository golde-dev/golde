import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { dnsPath, dnsRecordPath } from "../path.ts";
import { matchDNSRecord } from "../path.ts";

describe("matchDNSRecord", () => {
  it("should match dns path and attribute path", () => {
    const examples = [
      {
        path: dnsPath("acme.dev", "A", "@"),
        resourcePath: dnsPath("acme.dev", "A", "@"),
        recordPath: dnsRecordPath("acme.dev", "A", "@"),
        attributePath: null,
      },
      {
        path: `${dnsPath("acme.dev", "A", "@")}.id`,
        resourcePath: dnsPath("acme.dev", "A", "@"),
        recordPath: dnsRecordPath("acme.dev", "A", "@"),
        attributePath: "id",
      },
      {
        path: `${dnsPath("acme.dev", "A", "sub.sub")}.config`,
        resourcePath: dnsPath("acme.dev", "A", "sub.sub"),
        recordPath: dnsRecordPath("acme.dev", "A", "sub.sub"),
        attributePath: "config",
      },
    ];

    for (const { path, recordPath, attributePath, resourcePath } of examples) {
      const match = matchDNSRecord(path);

      if (!match) {
        throw new Error(`Failed to match ${path}`);
      }
      const [actualResourcePath, actualRecordPath, actualAttributePath] = match;

      expect(actualResourcePath).toEqual(resourcePath);
      expect(actualRecordPath).toEqual(recordPath);
      expect(actualAttributePath).toEqual(attributePath);
    }
  });

  it("should not match not dns record path", () => {
    const examples = [
      "aws.iamUser.user",
      "aws.iamUser.user.arn",
    ];

    for (const path of examples) {
      const match = matchDNSRecord(path);
      expect(match).toBeUndefined();
    }
  });

  it("should throw when path is incorrect", () => {
    const examples = [
      `cloudflare.dnsRecord.my.invalidType`,
      `cloudflare.dnsRecord['my.dev'].A.test.invalidAttribute`,
      `cloudflare.dnsRecord['my.dev'].A.@-invalidName`,
    ];

    for (const path of examples) {
      expect(() => matchDNSRecord(path)).toThrow(
        `Incorrect Cloudflare DNS record path: ${path}`,
      );
    }
  });
});
