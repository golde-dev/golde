import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createCloudflareDNSPlan, createCloudflareExecutors } from "../cloudflare.ts";
import type { CreateZoneRecord } from "../cloudflare.ts";
import { type CreateUnit, Type } from "../../../types/plan.ts";
import type { CloudflareClient } from "../../../clients/cloudflare.ts";
import type { GitInfo } from "../../../clients/git.ts";
import type {
  CloudflareDNSRecord,
  CloudflareDNSRecordState,
  CloudflareDNSZones,
  CloudflareZonesState,
} from "../../types.ts";

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
