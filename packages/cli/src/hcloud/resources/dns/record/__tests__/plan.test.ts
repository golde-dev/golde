import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import { Type } from "../../../../../types/plan.ts";
import { createDNSPlan } from "../plan.ts";
import type { CreateRecord, DeleteRecord, Executors, UpdateRecord } from "../executor.ts";
import type { DNSConfig, DNSState, RecordConfig, RecordState } from "../types.ts";
import type { ZoneConfigs } from "../../../zone/types.ts";
import type {
  CreateUnit,
  DeleteUnit,
  NoopUnit,
  UpdateUnit,
} from "../../../../../types/plan.ts";
import type { WithBranch } from "../../../../../types/config.ts";

const executors = {
  createRecord: spy(),
  updateRecord: spy(),
  deleteRecord: spy(),
} as unknown as Executors;

describe("hcloud dns record plan", () => {
  describe("create", () => {
    it("creates record with single value", async () => {
      const recordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: "1.2.3.4",
        ttl: 3600,
      };
      const config: DNSConfig = {
        "golde.dev": { "A": { "www": recordConfig } },
      };

      const result = await createDNSPlan(executors, {}, config);

      const create: CreateUnit<RecordConfig, RecordState, CreateRecord> = {
        type: Type.Create,
        executor: executors.createRecord,
        args: ["golde.dev", "A", "www", recordConfig],
        path: "hcloud.dns.record.golde.dev.A.www",
        dependsOn: [],
        config: recordConfig,
      };
      expect(result).toEqual([create]);
    });

    it("creates record with multi-value", async () => {
      const recordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: ["1.2.3.4", "5.6.7.8"],
      };
      const config: DNSConfig = {
        "golde.dev": { "A": { "lb": recordConfig } },
      };

      const result = await createDNSPlan(executors, {}, config);

      const create: CreateUnit<RecordConfig, RecordState, CreateRecord> = {
        type: Type.Create,
        executor: executors.createRecord,
        args: ["golde.dev", "A", "lb", recordConfig],
        path: "hcloud.dns.record.golde.dev.A.lb",
        dependsOn: [],
        config: recordConfig,
      };
      expect(result).toEqual([create]);
    });

    it("injects synthetic zone dep when zone is Golde-managed", async () => {
      const recordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: "1.2.3.4",
      };
      const config: DNSConfig = {
        "golde.dev": { "A": { "www": recordConfig } },
      };
      const managedZones: ZoneConfigs = {
        "golde.dev": { mode: "primary", branch: "master" },
      };

      const result = await createDNSPlan(executors, {}, config, managedZones);

      expect(result).toHaveLength(1);
      const unit = result[0] as CreateUnit<RecordConfig, RecordState, CreateRecord>;
      expect(unit.type).toEqual(Type.Create);
      expect(unit.args[0]).toEqual("{{ resources.hcloud.dns.zone.golde.dev.name }}");
      expect(unit.dependsOn).toEqual([
        {
          valuePath: "hcloud.dns.zone.golde.dev.name",
          resourcePath: "hcloud.dns.zone.golde.dev",
          resourceName: "golde.dev",
          resourceAttribute: "name",
        },
      ]);
    });
  });

  describe("update", () => {
    it("emits update when value changes", async () => {
      const prev: WithBranch<RecordConfig> = {
        branch: "master",
        value: "1.2.3.4",
        ttl: 3600,
      };
      const next: WithBranch<RecordConfig> = { ...prev, value: "5.6.7.8" };
      const recordState: RecordState = {
        zoneName: "golde.dev",
        rrsetId: "www/A",
        name: "www",
        type: "A",
        ttl: 3600,
        records: [{ value: "1.2.3.4" }],
        labels: {},
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prev,
      };

      const result = await createDNSPlan(
        executors,
        { "golde.dev": { "A": { "www": recordState } } },
        { "golde.dev": { "A": { "www": next } } },
      );

      const update: UpdateUnit<RecordConfig, RecordState, UpdateRecord> = {
        type: Type.Update,
        executor: executors.updateRecord,
        args: ["golde.dev", "A", "www", recordState, next],
        path: "hcloud.dns.record.golde.dev.A.www",
        dependsOn: [],
        state: recordState,
        config: next,
      };
      expect(result).toEqual([update]);
    });

    it("emits noop when only value order differs", async () => {
      const prev: WithBranch<RecordConfig> = {
        branch: "master",
        value: ["1.2.3.4", "5.6.7.8"],
        ttl: 3600,
      };
      const next: WithBranch<RecordConfig> = {
        ...prev,
        value: ["5.6.7.8", "1.2.3.4"],
      };
      const recordState: RecordState = {
        zoneName: "golde.dev",
        rrsetId: "lb/A",
        name: "lb",
        type: "A",
        ttl: 3600,
        records: [{ value: "1.2.3.4" }, { value: "5.6.7.8" }],
        labels: {},
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prev,
      };

      const result = await createDNSPlan(
        executors,
        { "golde.dev": { "A": { "lb": recordState } } },
        { "golde.dev": { "A": { "lb": next } } },
      );

      const noop: NoopUnit<RecordConfig, RecordState> = {
        type: Type.Noop,
        path: "hcloud.dns.record.golde.dev.A.lb",
        config: next,
        state: recordState,
        dependsOn: [],
      };
      expect(result).toEqual([noop]);
    });
  });

  describe("delete", () => {
    it("deletes record present in state but missing from config", async () => {
      const recordConfig: WithBranch<RecordConfig> = {
        branch: "master",
        value: "1.2.3.4",
      };
      const recordState: RecordState = {
        zoneName: "golde.dev",
        rrsetId: "www/A",
        name: "www",
        type: "A",
        ttl: 3600,
        records: [{ value: "1.2.3.4" }],
        labels: {},
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: recordConfig,
      };
      const state: DNSState = {
        "golde.dev": { "A": { "www": recordState } },
      };

      const result = await createDNSPlan(executors, state, {});

      const del: DeleteUnit<RecordState, DeleteRecord> = {
        type: Type.Delete,
        executor: executors.deleteRecord,
        args: ["golde.dev", "A", "www", recordState],
        path: "hcloud.dns.record.golde.dev.A.www",
        state: recordState,
        dependsOn: [],
      };
      expect(result).toEqual([del]);
    });
  });
});
