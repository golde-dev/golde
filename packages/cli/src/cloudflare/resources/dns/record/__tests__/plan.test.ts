import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createDNSPlan } from "../plan.ts";
import { Type } from "../../../../../types/plan.ts";
import { createDNSExecutors } from "../executor.ts";
import { assertBranch } from "../../../../../utils/resource.ts";
import type { CreateZoneRecord, DeleteZoneRecord, UpdateZoneRecord } from "../executor.ts";
import type { CloudflareClient } from "../../../../client/client.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, UpdateUnit } from "../../../../../types/plan.ts";
import type { WithBranch } from "../../../../../types/config.ts";
import type { DNSConfig, DNSState, RecordConfig, RecordState } from "../types.ts";

const executors = createDNSExecutors(
  {} as unknown as CloudflareClient,
);

describe("cloudflare dns", () => {
  describe("create new record", () => {
    it("should create record for new config on default branch", async () => {
      const recordConfig: WithBranch<RecordConfig> = {
        branch: "master",
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

      const result = await createDNSPlan(
        executors,
        {},
        state,
        config,
      );

      assertBranch(recordConfig);

      const create: CreateUnit<RecordConfig, RecordState, CreateZoneRecord> = {
        type: Type.Create,
        executor: executors.createZoneRecord,
        args: ["golde.dev", "A", "dns-cloudflare", recordConfig],
        path: "cloudflare.dns.record.golde.dev.A.dns-cloudflare",
        dependsOn: [],
        config: recordConfig,
      };
      expect(result).toEqual([create]);
    });

    it("should create record with multi-value config", async () => {
      const recordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: ["20.10.10.1", "20.10.10.2"],
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

      const result = await createDNSPlan(
        executors,
        {},
        state,
        config,
      );

      assertBranch(recordConfig);

      const create: CreateUnit<RecordConfig, RecordState, CreateZoneRecord> = {
        type: Type.Create,
        executor: executors.createZoneRecord,
        args: ["golde.dev", "A", "dns-cloudflare", recordConfig],
        path: "cloudflare.dns.record.golde.dev.A.dns-cloudflare",
        dependsOn: [],
        config: recordConfig,
      };
      expect(result).toEqual([create]);
    });

    it("should include top level tags dns config", async () => {
      const recordConfig = {
        branch: "master",
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

      const result = await createDNSPlan(
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
        path: "cloudflare.dns.record.golde.dev.A.dns-cloudflare",
        dependsOn: [],
        config: recordConfigWithTags,
      };
      expect(result).toEqual([create]);
    });
  });

  describe("update record", () => {
    it("should update record when config changes", async () => {
      const prevRecordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const updatedRecordConfig: WithBranch<RecordConfig> = {
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

      const recordState: RecordState = {
        records: { "20.10.10.1": "1234" },
        zoneId: "456",
        updatedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prevRecordConfig,
      };

      const state: DNSState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const update: UpdateUnit<RecordConfig, RecordState, UpdateZoneRecord> = {
        type: Type.Update,
        executor: executors.updateZoneRecord,
        args: ["golde.dev", "A", "dns-cloudflare", recordState, updatedRecordConfig],
        path: "cloudflare.dns.record.golde.dev.A.dns-cloudflare",
        dependsOn: [],
        state: recordState,
        config: updatedRecordConfig,
      };
      expect(result).toEqual([update]);
    });

    it("should update when adding values to record", async () => {
      const prevRecordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const updatedRecordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: ["20.10.10.1", "20.10.10.2"],
        ttl: 3600,
        proxied: false,
      };
      const config: DNSConfig = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": updatedRecordConfig,
          },
        },
      };

      const recordState: RecordState = {
        records: { "20.10.10.1": "1234" },
        zoneId: "456",
        updatedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prevRecordConfig,
      };

      const state: DNSState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const update: UpdateUnit<RecordConfig, RecordState, UpdateZoneRecord> = {
        type: Type.Update,
        executor: executors.updateZoneRecord,
        args: ["golde.dev", "A", "dns-cloudflare", recordState, updatedRecordConfig],
        path: "cloudflare.dns.record.golde.dev.A.dns-cloudflare",
        dependsOn: [],
        state: recordState,
        config: updatedRecordConfig,
      };
      expect(result).toEqual([update]);
    });

    it("should noop when multi-value order differs but same values", async () => {
      const prevRecordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: ["20.10.10.1", "20.10.10.2"],
        ttl: 3600,
        proxied: false,
      };
      const nextRecordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: ["20.10.10.2", "20.10.10.1"],
        ttl: 3600,
        proxied: false,
      };
      const config: DNSConfig = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": nextRecordConfig,
          },
        },
      };

      const recordState: RecordState = {
        records: {
          "20.10.10.1": "1234",
          "20.10.10.2": "5678",
        },
        zoneId: "456",
        updatedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prevRecordConfig,
      };

      const state: DNSState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const noop: NoopUnit<RecordConfig, RecordState> = {
        type: Type.Noop,
        path: "cloudflare.dns.record.golde.dev.A.dns-cloudflare",
        config: nextRecordConfig,
        state: recordState,
        dependsOn: [],
      };
      expect(result).toEqual([noop]);
    });
  });

  describe("delete record", () => {
    it("should delete single-value record", async () => {
      const config: DNSConfig = {};

      const recordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };

      const recordState: RecordState = {
        records: { "20.10.10.1": "1234" },
        zoneId: "456",
        updatedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        dependsOn: [],
        config: recordConfig,
      };

      const state: DNSState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const deleteUnit: DeleteUnit<RecordState, DeleteZoneRecord> = {
        type: Type.Delete,
        executor: executors.deleteZoneRecord,
        args: ["golde.dev", recordState],
        path: "cloudflare.dns.record.golde.dev.A.dns-cloudflare",
        state: recordState,
        dependsOn: [],
      };

      expect(result).toEqual([deleteUnit]);
    });

    it("should delete multi-value record", async () => {
      const config: DNSConfig = {};

      const recordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: ["20.10.10.1", "20.10.10.2"],
        ttl: 3600,
        proxied: false,
      };

      const recordState: RecordState = {
        records: {
          "20.10.10.1": "1234",
          "20.10.10.2": "5678",
        },
        zoneId: "456",
        updatedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        dependsOn: [],
        config: recordConfig,
      };

      const state: DNSState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const deleteUnit: DeleteUnit<RecordState, DeleteZoneRecord> = {
        type: Type.Delete,
        executor: executors.deleteZoneRecord,
        args: ["golde.dev", recordState],
        path: "cloudflare.dns.record.golde.dev.A.dns-cloudflare",
        state: recordState,
        dependsOn: [],
      };

      expect(result).toEqual([deleteUnit]);
    });
  });

  describe("noop changes on record", () => {
    it("when state and config are the same", async () => {
      const prevRecordConfig: WithBranch<RecordConfig> = {
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
      const recordState: RecordState = {
        records: { "20.10.10.1": "1234" },
        zoneId: "456",
        updatedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prevRecordConfig,
      };
      const state: DNSState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createDNSPlan(
        executors,
        {},
        state,
        config,
      );

      const noop: NoopUnit<RecordConfig, RecordState> = {
        type: Type.Noop,
        path: "cloudflare.dns.record.golde.dev.A.dns-cloudflare",
        config: prevRecordConfig,
        state: recordState,
        dependsOn: [],
      };

      expect(result).toEqual([noop]);
    });
  });
});
