import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import { Type } from "../../../../types/plan.ts";
import { createZonePlan } from "../plan.ts";
import type { CreateZone, DeleteZone, Executors, UpdateZone } from "../executor.ts";
import type { ZoneConfig, ZoneConfigs, ZoneState, ZoneStates } from "../types.ts";
import type {
  CreateUnit,
  DeleteUnit,
  NoopUnit,
  UpdateUnit,
} from "../../../../types/plan.ts";
import type { WithBranch } from "../../../../types/config.ts";

const executors = {
  createZone: spy(),
  updateZone: spy(),
  deleteZone: spy(),
} as unknown as Executors;

describe("hcloud zone plan", () => {
  describe("create", () => {
    it("creates a zone when config is new", async () => {
      const zoneConfig: WithBranch<ZoneConfig> = {
        branch: "master",
        mode: "primary",
        ttl: 86400,
      };
      const config: ZoneConfigs = { "golde.dev": zoneConfig };
      const result = await createZonePlan(executors, {}, config);

      const create: CreateUnit<ZoneConfig, ZoneState, CreateZone> = {
        type: Type.Create,
        executor: executors.createZone,
        args: ["golde.dev", zoneConfig],
        path: "hcloud.dns.zone.golde.dev",
        dependsOn: [],
        config: zoneConfig,
      };
      expect(result).toEqual([create]);
    });
  });

  describe("delete", () => {
    it("deletes a zone present in state but missing from config", async () => {
      const zoneConfig: WithBranch<ZoneConfig> = {
        branch: "master",
        mode: "primary",
        ttl: 86400,
      };
      const zoneState: ZoneState = {
        id: 1,
        name: "golde.dev",
        mode: "primary",
        ttl: 86400,
        status: "ok",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: zoneConfig,
      };
      const state: ZoneStates = { "golde.dev": zoneState };
      const result = await createZonePlan(executors, state, {});

      const del: DeleteUnit<ZoneState, DeleteZone> = {
        type: Type.Delete,
        executor: executors.deleteZone,
        args: [zoneState],
        path: "hcloud.dns.zone.golde.dev",
        state: zoneState,
        dependsOn: [],
      };
      expect(result).toEqual([del]);
    });
  });

  describe("update", () => {
    it("updates ttl in place", async () => {
      const prev: WithBranch<ZoneConfig> = {
        branch: "master",
        mode: "primary",
        ttl: 86400,
      };
      const next: WithBranch<ZoneConfig> = { ...prev, ttl: 3600 };
      const zoneState: ZoneState = {
        id: 1,
        name: "golde.dev",
        mode: "primary",
        ttl: 86400,
        status: "ok",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prev,
      };

      const result = await createZonePlan(
        executors,
        { "golde.dev": zoneState },
        { "golde.dev": next },
      );

      const update: UpdateUnit<ZoneConfig, ZoneState, UpdateZone> = {
        type: Type.Update,
        executor: executors.updateZone,
        args: ["golde.dev", next, zoneState],
        path: "hcloud.dns.zone.golde.dev",
        dependsOn: [],
        state: zoneState,
        config: next,
      };
      expect(result).toEqual([update]);
    });

    it("rejects mode change", async () => {
      const prev: WithBranch<ZoneConfig> = {
        branch: "master",
        mode: "primary",
        ttl: 86400,
      };
      const next: WithBranch<ZoneConfig> = {
        ...prev,
        mode: "secondary",
        primaryNameservers: [{ address: "1.2.3.4" }],
      };
      const zoneState: ZoneState = {
        id: 1,
        name: "golde.dev",
        mode: "primary",
        ttl: 86400,
        status: "ok",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prev,
      };

      await expect(createZonePlan(
        executors,
        { "golde.dev": zoneState },
        { "golde.dev": next },
      )).rejects.toThrow("Cannot change mode for zone golde.dev in place");
    });
  });

  describe("noop", () => {
    it("emits noop when state and config match", async () => {
      const same: WithBranch<ZoneConfig> = {
        branch: "master",
        mode: "primary",
        ttl: 86400,
      };
      const zoneState: ZoneState = {
        id: 1,
        name: "golde.dev",
        mode: "primary",
        ttl: 86400,
        status: "ok",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: same,
      };
      const result = await createZonePlan(
        executors,
        { "golde.dev": zoneState },
        { "golde.dev": same },
      );

      const noop: NoopUnit<ZoneConfig, ZoneState> = {
        type: Type.Noop,
        path: "hcloud.dns.zone.golde.dev",
        config: same,
        state: zoneState,
        dependsOn: [],
      };
      expect(result).toEqual([noop]);
    });
  });
});
