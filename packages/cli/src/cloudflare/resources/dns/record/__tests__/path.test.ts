import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { dnsPath, dnsRecordPath } from "../path.ts";
import { matchDNSRecord } from "../path.ts";

describe("matchDNSRecord", () => {
  it("should match dns path and attribute path", () => {
    const examples = [
      {
        path: `${dnsPath("acme.dev", "A", "@")}.zoneId`,
        resourcePath: dnsPath("acme.dev", "A", "@"),
        recordPath: dnsRecordPath("acme.dev", "A", "@"),
        attributePath: "zoneId",
      },
      {
        path: `${dnsPath("acme.dev", "A", "sub")}.updatedAt`,
        resourcePath: dnsPath("acme.dev", "A", "sub"),
        recordPath: dnsRecordPath("acme.dev", "A", "sub"),
        attributePath: "updatedAt",
      },
      {
        path: `${dnsPath("acme.dev", "A", "sub.sub")}.zoneId`,
        resourcePath: dnsPath("acme.dev", "A", "sub.sub"),
        recordPath: dnsRecordPath("acme.dev", "A", "sub.sub"),
        attributePath: "zoneId",
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
      "aws.iam.user.user",
      "aws.iam.user.user.arn",
    ];

    for (const path of examples) {
      const match = matchDNSRecord(path);
      expect(match).toBeUndefined();
    }
  });

  it("should throw when path is incorrect", () => {
    const examples = [
      `cloudflare.dns.record.my.dev.invalidType`,
      `cloudflare.dns.record.my.dev.A.test.invalid.invalid`,
      `cloudflare.dns.record.my.dev.A.@.invalidAttribute`,
      `cloudflare.dns.record.my.dev.A.@.id`,
    ];

    for (const path of examples) {
      expect(() => matchDNSRecord(path)).toThrow(
        `Incorrect Cloudflare DNS Record path: ${path}`,
      );
    }
  });
});
