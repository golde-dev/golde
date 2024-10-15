import { assertEquals } from "@std/assert";
import {
  createCloudflareDNSPlan,
  createCloudflareExecutors,
  type CreateZoneRecord,
} from "../cloudflare.ts";
import { type CreateUnit, Type } from "../../../types/plan.ts";
import type { CloudflareClient } from "../../../clients/cloudflare.ts";
import { describe, it } from "@std/testing/bdd";
import type {
  CloudflareDNSRecord,
  CloudflareDNSRecordState,
  CloudflareDNSZones,
  CloudflareZonesState,
} from "../../types.ts";
import type { GitInfo } from "../../../clients/git.ts";
import { expect } from "@std/expect";

const executors = createCloudflareExecutors(
  {} as unknown as CloudflareClient,
);

describe("create new record", () => {
  it("should create bucket for new config on default branch", async () => {
    const git = {
      defaultBranch: "master",
      branchName: "master",
    } as GitInfo;

    const recordConfig = {
      value: "20.10.10.1",
      ttl: 3600,
      proxied: false,
    };
    const config: CloudflareDNSZones = {
      "golde.dev": {
        "A": {
          "dns-cloudflare": {
            value: "20.10.10.1",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    const state: CloudflareZonesState = {};

    const result = await createCloudflareDNSPlan(
      executors,
      git,
      state,
      config,
    );

    const create: CreateUnit<CloudflareDNSRecord, CloudflareDNSRecordState, CreateZoneRecord> = {
      type: Type.Create,
      executor: executors.createZoneRecord,
      args: ["golde.dev", "A", "dns-cloudflare", recordConfig],
      path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
      dependencies: [],
      config: recordConfig,
    };
    expect(result).toEqual([create]);
  });
});

Deno.test("createCloudflareDNSPlan", async (t) => {
  const executors = createCloudflareExecutors(
    {} as unknown as CloudflareClient,
  );

  await t.step("add new records", async () => {
    const nextConfig = {
      "golde.dev": {
        "A": {
          "dns-cloudflare": {
            value: "20.10.10.1",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };

    assertEquals(
      await createCloudflareDNSPlan(
        executors,
        undefined,
        undefined,
        nextConfig,
      ),
      [
        {
          "args": [
            "golde.dev",
            {
              "comment": undefined,
              "content": "20.10.10.1",
              "name": "dns-cloudflare",
              "proxied": false,
              "tags": undefined,
              "ttl": 3600,
              "type": "A",
            },
          ],
          "dependencies": [],
          "executor": executors.createZoneRecord,
          "path": "dns.cloudflare.golde.dev.A.dns-cloudflare",
          "type": Type.Create,
        },
      ],
    );
  });

  await t.step("delete records", async () => {
    const prevConfig = {
      "golde.dev": {
        "A": {
          "dns-cloudflare": {
            value: "20.10.10.1",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    const prevState = {
      "golde.dev": {
        "A": {
          "dns-cloudflare": {
            id: "cloudflare id",
            value: "20.10.10.1",
            zone_id: "1",
            modified_on: "",
            created_on: "",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    const nextConfig = undefined;
    assertEquals(
      await createCloudflareDNSPlan(
        executors,
        prevConfig,
        prevState,
        nextConfig,
      ),
      [
        {
          "args": [
            "golde.dev",
            "cloudflare id",
          ],
          "dependencies": [],
          "executor": executors.deleteZoneRecord,
          "path": "dns.cloudflare.golde.dev.A.dns-cloudflare",
          "type": Type.Delete,
        },
      ],
    );
  });

  await t.step("update records", async () => {
    const prevConfig = {
      "golde.dev": {
        "A": {
          "dns-cloudflare": {
            value: "20.10.10.1",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    const prevState = {
      "golde.dev": {
        "A": {
          "dns-cloudflare": {
            id: "cloudflare id",
            value: "20.10.10.1",
            zone_id: "1",
            modified_on: "",
            created_on: "",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    const nextConfig = {
      "golde.dev": {
        "A": {
          "dns-cloudflare": {
            value: "20.10.10.10",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    assertEquals(
      await createCloudflareDNSPlan(
        executors,
        prevConfig,
        prevState,
        nextConfig,
      ),
      [
        {
          "args": [
            "golde.dev",
            "cloudflare id",
            {
              "comment": undefined,
              "content": "20.10.10.10",
              "name": "dns-cloudflare",
              "proxied": false,
              "tags": undefined,
              "ttl": 3600,
              "type": "A",
            },
          ],
          "dependencies": [],
          "executor": executors.updateZoneRecord,
          "path": "dns.cloudflare.golde.dev.A.dns-cloudflare",
          "type": Type.Update,
        },
      ],
    );
  });
});
