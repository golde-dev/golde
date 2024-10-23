import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createCloudflareDNSPlan, createCloudflareExecutors } from "../cloudflare.ts";
import { Type } from "../../../types/plan.ts";
import type { CreateZoneRecord, DeleteZoneRecord, UpdateZoneRecord } from "../cloudflare.ts";
import type { CloudflareClient } from "../../../clients/cloudflare/client.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, UpdateUnit } from "../../../types/plan.ts";
import type {
  CloudflareDNSRecord,
  CloudflareDNSRecordState,
  CloudflareDNSZones,
  CloudflareZonesState,
} from "../../types.ts";

const executors = createCloudflareExecutors(
  {} as unknown as CloudflareClient,
);

describe.skip("cloudflare dsn", () => {
  describe("create new record", () => {
    it("should create bucket for new config on default branch", async () => {
      const recordConfig = {
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordConfig,
          },
        },
      };
      const state: CloudflareZonesState = {};

      const result = await createCloudflareDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const create: CreateUnit<CloudflareDNSRecord, CloudflareDNSRecordState, CreateZoneRecord> = {
        type: Type.Create,
        executor: executors.createZoneRecord,
        args: ["golde.dev", "A", "dns-cloudflare", recordConfig],
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        dependsOn: [],
        config: recordConfig,
      };
      expect(result).toEqual([create]);
    });

    it("should include top level tags dns config", async () => {
      const recordConfig = {
        value: "20.10.10.1",
        ttl: 3600,
        tags: {
          "Type": "dns",
        },
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordConfig,
          },
        },
      };
      const state: CloudflareZonesState = {};
      const tags = {
        "ProjectCode": "my-project",
        "Environment": "production",
      };

      const result = await createCloudflareDNSPlan(
        executors,
        tags,
        state,
        config,
      );

      const recordConfigWithTags = {
        ...recordConfig,
        tags: {
          "ProjectCode": "my-project",
          "Environment": "production",
          "Type": "dns",
        },
      };

      const create: CreateUnit<CloudflareDNSRecord, CloudflareDNSRecordState, CreateZoneRecord> = {
        type: Type.Create,
        executor: executors.createZoneRecord,
        args: ["golde.dev", "A", "dns-cloudflare", recordConfigWithTags],
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        dependsOn: [],
        config: recordConfigWithTags,
      };
      expect(result).toEqual([create]);
    });
  });

  describe("update record", () => {
    it("should update record for new config on default branch", async () => {
      const prevRecordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const updatedRecordConfig = {
        branch: "master",
        value: "20.10.10.2",
        ttl: 600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": updatedRecordConfig,
          },
        },
      };

      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.2",
        ttl: 3600,
        proxied: false,
        config: prevRecordConfig,
      };

      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const update: UpdateUnit<CloudflareDNSRecord, CloudflareDNSRecordState, UpdateZoneRecord> = {
        type: Type.Update,
        executor: executors.updateZoneRecord,
        args: ["golde.dev", "A", "dns-cloudflare", "1234", updatedRecordConfig],
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        dependsOn: [],
        state: recordState,
        config: updatedRecordConfig,
      };
      expect(result).toEqual([update]);
    });

    it("should include top level tags dns config", () => {
    });
  });

  describe("delete record", () => {
    it("should delete record for new config on default branch", async () => {
      const config: CloudflareDNSZones = {};

      const recordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };

      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
        config: recordConfig,
      };

      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const deleteUnit: DeleteUnit<CloudflareDNSRecordState, DeleteZoneRecord> = {
        type: Type.Delete,
        executor: executors.deleteZoneRecord,
        args: ["golde.dev", "1234"],
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        state: recordState,
      };

      expect(result).toEqual([deleteUnit]);
    });
  });

  describe("noop changes on record", () => {
    it("when state and config are the same", async () => {
      const prevRecordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": prevRecordConfig,
          },
        },
      };
      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
        config: prevRecordConfig,
      };
      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const noop: NoopUnit<CloudflareDNSRecord, CloudflareDNSRecordState> = {
        type: Type.Noop,
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        config: prevRecordConfig,
        state: recordState,
      };

      expect(result).toEqual([noop]);
    });
  });
});
