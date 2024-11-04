import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createCloudflareDNSPlan, createDNSExecutors } from "../plan.ts";
import { Type } from "../../../types/plan.ts";
import type { CreateZoneRecord, DeleteZoneRecord, UpdateZoneRecord } from "../plan.ts";
import type { CloudflareClient } from "../../client/client.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, UpdateUnit } from "../../../types/plan.ts";
import type { DNSConfig, DNSState, RecordConfig, RecordState } from "../types.ts";

const executors = createDNSExecutors(
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
      const config: DNSConfig = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordConfig,
          },
        },
      };
      const state: DNSState = {};

      const result = await createCloudflareDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const create: CreateUnit<RecordConfig, RecordState, CreateZoneRecord> = {
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
      const config: DNSConfig = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordConfig,
          },
        },
      };
      const state: DNSState = {};
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

      const create: CreateUnit<RecordConfig, RecordState, CreateZoneRecord> = {
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
      const config: DNSConfig = {
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

      const state: DNSState = {
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

      const update: UpdateUnit<RecordConfig, RecordState, UpdateZoneRecord> = {
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
      const config: DNSConfig = {};

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

      const state: DNSState = {
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

      const deleteUnit: DeleteUnit<RecordState, DeleteZoneRecord> = {
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
      const config: DNSConfig = {
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
      const state: DNSState = {
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

      const noop: NoopUnit<RecordConfig, RecordState> = {
        type: Type.Noop,
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        config: prevRecordConfig,
        state: recordState,
      };

      expect(result).toEqual([noop]);
    });
  });
});
