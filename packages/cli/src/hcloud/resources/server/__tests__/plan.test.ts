import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import { Type } from "../../../../types/plan.ts";
import { createServerPlan } from "../plan.ts";
import { assertBranch } from "../../../../utils/resource.ts";
import type { CreateServer, DeleteServer, Executors, UpdateServer } from "../executor.ts";
import type {
  ServerConfig,
  ServerConfigs,
  ServerState,
  ServerStates,
} from "../types.ts";
import type {
  CreateUnit,
  DeleteUnit,
  NoopUnit,
  UpdateUnit,
} from "../../../../types/plan.ts";
import type { WithBranch } from "../../../../types/config.ts";

const executors = {
  createServer: spy(),
  updateServer: spy(),
  deleteServer: spy(),
} as unknown as Executors;

describe("hcloud server plan", () => {
  describe("create", () => {
    it("creates a server when config is new", async () => {
      const serverConfig: WithBranch<ServerConfig> = {
        branch: "master",
        image: "ubuntu-22.04",
        serverType: "cpx11",
        location: "fsn1",
      };
      const config: ServerConfigs = { "web-1": serverConfig };
      const result = await createServerPlan(executors, {}, config);

      assertBranch(serverConfig);
      const create: CreateUnit<ServerConfig, ServerState, CreateServer> = {
        type: Type.Create,
        executor: executors.createServer,
        args: ["web-1", serverConfig],
        path: "hcloud.server.web-1",
        dependsOn: [],
        config: serverConfig,
      };
      expect(result).toEqual([create]);
    });
  });

  describe("delete", () => {
    it("deletes a server present in state but missing from config", async () => {
      const serverConfig: WithBranch<ServerConfig> = {
        branch: "master",
        image: "ubuntu-22.04",
        serverType: "cpx11",
      };
      const serverState: ServerState = {
        id: 1,
        name: "web-1",
        ipv4: "1.2.3.4",
        status: "running",
        datacenter: "fsn1-dc14",
        location: "fsn1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: serverConfig,
      };
      const state: ServerStates = { "web-1": serverState };

      const result = await createServerPlan(executors, state, {});

      const del: DeleteUnit<ServerState, DeleteServer> = {
        type: Type.Delete,
        executor: executors.deleteServer,
        args: [serverState],
        path: "hcloud.server.web-1",
        state: serverState,
        dependsOn: [],
      };
      expect(result).toEqual([del]);
    });
  });

  describe("update", () => {
    it("updates server when only labels change", async () => {
      const prevConfig: WithBranch<ServerConfig> = {
        branch: "master",
        image: "ubuntu-22.04",
        serverType: "cpx11",
        location: "fsn1",
        labels: { env: "old" },
      };
      const nextConfig: WithBranch<ServerConfig> = {
        ...prevConfig,
        labels: { env: "new" },
      };
      const serverState: ServerState = {
        id: 1,
        name: "web-1",
        ipv4: "1.2.3.4",
        status: "running",
        datacenter: "fsn1-dc14",
        location: "fsn1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prevConfig,
      };

      const result = await createServerPlan(
        executors,
        { "web-1": serverState },
        { "web-1": nextConfig },
      );

      const update: UpdateUnit<ServerConfig, ServerState, UpdateServer> = {
        type: Type.Update,
        executor: executors.updateServer,
        args: ["web-1", nextConfig, serverState],
        path: "hcloud.server.web-1",
        dependsOn: [],
        state: serverState,
        config: nextConfig,
      };
      expect(result).toEqual([update]);
    });

    it("updates server when serverType changes", async () => {
      const prevConfig: WithBranch<ServerConfig> = {
        branch: "master",
        image: "ubuntu-22.04",
        serverType: "cpx11",
        location: "fsn1",
      };
      const nextConfig: WithBranch<ServerConfig> = {
        ...prevConfig,
        serverType: "cpx21",
      };
      const serverState: ServerState = {
        id: 1,
        name: "web-1",
        ipv4: "1.2.3.4",
        status: "running",
        datacenter: "fsn1-dc14",
        location: "fsn1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prevConfig,
      };

      const result = await createServerPlan(
        executors,
        { "web-1": serverState },
        { "web-1": nextConfig },
      );

      const update: UpdateUnit<ServerConfig, ServerState, UpdateServer> = {
        type: Type.Update,
        executor: executors.updateServer,
        args: ["web-1", nextConfig, serverState],
        path: "hcloud.server.web-1",
        dependsOn: [],
        state: serverState,
        config: nextConfig,
      };
      expect(result).toEqual([update]);
    });

    it("rejects image change with PlanError", async () => {
      const prevConfig: WithBranch<ServerConfig> = {
        branch: "master",
        image: "ubuntu-22.04",
        serverType: "cpx11",
      };
      const nextConfig: WithBranch<ServerConfig> = {
        ...prevConfig,
        image: "ubuntu-24.04",
      };
      const serverState: ServerState = {
        id: 1,
        name: "web-1",
        status: "running",
        datacenter: "fsn1-dc14",
        location: "fsn1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prevConfig,
      };

      await expect(createServerPlan(
        executors,
        { "web-1": serverState },
        { "web-1": nextConfig },
      )).rejects.toThrow(
        "Cannot change image for server web-1 in place",
      );
    });

    it("rejects location change with PlanError", async () => {
      const prevConfig: WithBranch<ServerConfig> = {
        branch: "master",
        image: "ubuntu-22.04",
        serverType: "cpx11",
        location: "fsn1",
      };
      const nextConfig: WithBranch<ServerConfig> = {
        ...prevConfig,
        location: "nbg1",
      };
      const serverState: ServerState = {
        id: 1,
        name: "web-1",
        status: "running",
        datacenter: "fsn1-dc14",
        location: "fsn1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prevConfig,
      };

      await expect(createServerPlan(
        executors,
        { "web-1": serverState },
        { "web-1": nextConfig },
      )).rejects.toThrow(
        "Cannot change location for server web-1 in place",
      );
    });
  });

  describe("noop", () => {
    it("emits noop when state and config match", async () => {
      const sameConfig: WithBranch<ServerConfig> = {
        branch: "master",
        image: "ubuntu-22.04",
        serverType: "cpx11",
        location: "fsn1",
      };
      const serverState: ServerState = {
        id: 1,
        name: "web-1",
        ipv4: "1.2.3.4",
        status: "running",
        datacenter: "fsn1-dc14",
        location: "fsn1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: sameConfig,
      };

      const result = await createServerPlan(
        executors,
        { "web-1": serverState },
        { "web-1": sameConfig },
      );

      const noop: NoopUnit<ServerConfig, ServerState> = {
        type: Type.Noop,
        path: "hcloud.server.web-1",
        config: sameConfig,
        state: serverState,
        dependsOn: [],
      };
      expect(result).toEqual([noop]);
    });
  });
});
