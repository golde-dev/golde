import type { ResourceConfig, WithBranch } from "../../../types/config.ts";
import type { ResourceDependency } from "../../../types/dependencies.ts";

export interface SSHKeyConfig extends ResourceConfig {
  /**
   * SSH public key — single-line, e.g. `ssh-ed25519 AAAA... user@host`.
   * Hetzner does not allow this to be changed after creation.
   */
  publicKey: string;
  /**
   * Hetzner labels.
   */
  labels?: Record<string, string>;
}

export type SSHKeyConfigs = Record<string, SSHKeyConfig>;

export interface SSHKeyState {
  id: number;
  name: string;
  fingerprint: string;
  publicKey: string;
  createdAt: string;
  updatedAt: string;
  dependsOn: ResourceDependency[];
  config: WithBranch<SSHKeyConfig>;
}

export type SSHKeyStates = Record<string, SSHKeyState>;
