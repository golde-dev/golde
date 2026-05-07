import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import { Type } from "../../../../types/plan.ts";
import { createSshKeyPlan } from "../plan.ts";
import { assertBranch } from "../../../../utils/resource.ts";
import type { CreateSshKey, DeleteSshKey, Executors, UpdateSshKey } from "../executor.ts";
import type {
  SSHKeyConfig,
  SSHKeyConfigs,
  SSHKeyState,
  SSHKeyStates,
} from "../types.ts";
import type {
  CreateUnit,
  DeleteUnit,
  NoopUnit,
  UpdateUnit,
} from "../../../../types/plan.ts";
import type { WithBranch } from "../../../../types/config.ts";

const executors = {
  createSshKey: spy(),
  updateSshKey: spy(),
  deleteSshKey: spy(),
} as unknown as Executors;

describe("hcloud ssh key plan", () => {
  describe("create", () => {
    it("creates a key when config is new", async () => {
      const sshKeyConfig: WithBranch<SSHKeyConfig> = {
        branch: "master",
        publicKey: "ssh-ed25519 AAAA test",
      };
      const config: SSHKeyConfigs = { "deploy-key": sshKeyConfig };

      const result = await createSshKeyPlan(executors, {}, config);

      assertBranch(sshKeyConfig);
      const create: CreateUnit<SSHKeyConfig, SSHKeyState, CreateSshKey> = {
        type: Type.Create,
        executor: executors.createSshKey,
        args: ["deploy-key", sshKeyConfig],
        path: "hcloud.sshKey.deploy-key",
        dependsOn: [],
        config: sshKeyConfig,
      };
      expect(result).toEqual([create]);
    });
  });

  describe("delete", () => {
    it("deletes a key present in state but missing from config", async () => {
      const sshKeyConfig: WithBranch<SSHKeyConfig> = {
        branch: "master",
        publicKey: "ssh-ed25519 AAAA test",
      };
      const sshKeyState: SSHKeyState = {
        id: 42,
        name: "deploy-key",
        fingerprint: "aa:bb:cc",
        publicKey: "ssh-ed25519 AAAA test",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: sshKeyConfig,
      };
      const state: SSHKeyStates = { "deploy-key": sshKeyState };

      const result = await createSshKeyPlan(executors, state, {});

      const del: DeleteUnit<SSHKeyState, DeleteSshKey> = {
        type: Type.Delete,
        executor: executors.deleteSshKey,
        args: [sshKeyState],
        path: "hcloud.sshKey.deploy-key",
        state: sshKeyState,
        dependsOn: [],
      };
      expect(result).toEqual([del]);
    });
  });

  describe("update", () => {
    it("updates labels in place", async () => {
      const prev: WithBranch<SSHKeyConfig> = {
        branch: "master",
        publicKey: "ssh-ed25519 AAAA test",
        labels: { env: "old" },
      };
      const next: WithBranch<SSHKeyConfig> = {
        ...prev,
        labels: { env: "new" },
      };
      const sshKeyState: SSHKeyState = {
        id: 42,
        name: "deploy-key",
        fingerprint: "aa:bb:cc",
        publicKey: "ssh-ed25519 AAAA test",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prev,
      };

      const result = await createSshKeyPlan(
        executors,
        { "deploy-key": sshKeyState },
        { "deploy-key": next },
      );

      const update: UpdateUnit<SSHKeyConfig, SSHKeyState, UpdateSshKey> = {
        type: Type.Update,
        executor: executors.updateSshKey,
        args: ["deploy-key", next, sshKeyState],
        path: "hcloud.sshKey.deploy-key",
        dependsOn: [],
        state: sshKeyState,
        config: next,
      };
      expect(result).toEqual([update]);
    });

    it("rejects publicKey change with PlanError", async () => {
      const prev: WithBranch<SSHKeyConfig> = {
        branch: "master",
        publicKey: "ssh-ed25519 AAAA old",
      };
      const next: WithBranch<SSHKeyConfig> = {
        ...prev,
        publicKey: "ssh-ed25519 AAAA new",
      };
      const sshKeyState: SSHKeyState = {
        id: 42,
        name: "deploy-key",
        fingerprint: "aa:bb:cc",
        publicKey: "ssh-ed25519 AAAA old",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: prev,
      };

      await expect(createSshKeyPlan(
        executors,
        { "deploy-key": sshKeyState },
        { "deploy-key": next },
      )).rejects.toThrow(
        "Cannot change publicKey for ssh key deploy-key in place",
      );
    });
  });

  describe("noop", () => {
    it("emits noop when state and config match", async () => {
      const same: WithBranch<SSHKeyConfig> = {
        branch: "master",
        publicKey: "ssh-ed25519 AAAA test",
      };
      const sshKeyState: SSHKeyState = {
        id: 42,
        name: "deploy-key",
        fingerprint: "aa:bb:cc",
        publicKey: "ssh-ed25519 AAAA test",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        dependsOn: [],
        config: same,
      };

      const result = await createSshKeyPlan(
        executors,
        { "deploy-key": sshKeyState },
        { "deploy-key": same },
      );

      const noop: NoopUnit<SSHKeyConfig, SSHKeyState> = {
        type: Type.Noop,
        path: "hcloud.sshKey.deploy-key",
        config: same,
        state: sshKeyState,
        dependsOn: [],
      };
      expect(result).toEqual([noop]);
    });
  });
});
