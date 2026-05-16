import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { dnsPath, dnsRecordPath, matchHCloudDNSRecord } from "../path.ts";

describe("matchHCloudDNSRecord", () => {
  it("matches dns record paths", () => {
    const examples = [
      {
        path: `${dnsPath("golde.dev", "A", "@")}.zoneName`,
        resourcePath: dnsPath("golde.dev", "A", "@"),
        recordPath: dnsRecordPath("golde.dev", "A", "@"),
        attributePath: "zoneName",
      },
      {
        path: `${dnsPath("golde.dev", "A", "www")}.rrsetId`,
        resourcePath: dnsPath("golde.dev", "A", "www"),
        recordPath: dnsRecordPath("golde.dev", "A", "www"),
        attributePath: "rrsetId",
      },
      {
        path: `${dnsPath("golde.dev", "AAAA", "sub.web")}.createdAt`,
        resourcePath: dnsPath("golde.dev", "AAAA", "sub.web"),
        recordPath: dnsRecordPath("golde.dev", "AAAA", "sub.web"),
        attributePath: "createdAt",
      },
      {
        path: `${dnsPath("golde.dev", "TXT", "_spf")}.config.comment`,
        resourcePath: dnsPath("golde.dev", "TXT", "_spf"),
        recordPath: dnsRecordPath("golde.dev", "TXT", "_spf"),
        attributePath: "config.comment",
      },
    ];

    for (const { path, recordPath, attributePath, resourcePath } of examples) {
      const match = matchHCloudDNSRecord(path);
      if (!match) throw new Error(`Failed to match ${path}`);
      const [actualResourcePath, actualRecordPath, actualAttributePath] = match;
      expect(actualResourcePath).toEqual(resourcePath);
      expect(actualRecordPath).toEqual(recordPath);
      expect(actualAttributePath).toEqual(attributePath);
    }
  });

  it("does not match non-dns paths", () => {
    const examples = [
      "hcloud.server.web-1.id",
      "hcloud.dns.zone.golde.dev.id",
      "hcloud.sshKey.deploy-key.name",
    ];
    for (const path of examples) {
      expect(matchHCloudDNSRecord(path)).toBeUndefined();
    }
  });

  it("throws on incorrect path", () => {
    const examples = [
      "hcloud.dns.record.golde.dev.invalidType",
      "hcloud.dns.record.golde.dev.A.www.invalidAttribute",
    ];
    for (const path of examples) {
      expect(() => matchHCloudDNSRecord(path)).toThrow(
        `Incorrect HCloud DNS Record path: ${path}`,
      );
    }
  });
});
