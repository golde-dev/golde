import { logger } from "../../../logger.ts";
import { PlanError, PlanErrorCode } from "../../../error.ts";
import { Type } from "../../../types/plan.ts";
import { findResourceDependencies } from "../../../dependencies.ts";
import { isConfigEqual } from "../../../utils/config.ts";
import { assertBranch } from "../../../utils/resource.ts";
import { omitUndefined } from "../../../utils/object.ts";
import { sshKeyPath } from "./path.ts";
import type {
  CreateUnit,
  DeleteUnit,
  NoopUnit,
  Plan,
  UpdateUnit,
} from "../../../types/plan.ts";
import type { ResourceDependency } from "../../../types/dependencies.ts";
import type { SSHKeyConfig, SSHKeyConfigs, SSHKeyState, SSHKeyStates } from "./types.ts";
import type { CreateSshKey, DeleteSshKey, Executors, UpdateSshKey } from "./executor.ts";

function getPrevious(state: SSHKeyStates = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: SSHKeyConfig;
      state: SSHKeyState;
    };
  } = {};

  for (const [name, sshKey] of Object.entries(state)) {
    previous[sshKeyPath(name)] = {
      name,
      config: sshKey.config,
      state: sshKey,
    };
  }
  return previous;
}

function getNext(config: SSHKeyConfigs = {}) {
  const next: {
    [path: string]: {
      name: string;
      config: SSHKeyConfig;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [name, sshKey] of Object.entries(config)) {
    next[sshKeyPath(name)] = {
      name,
      config: omitUndefined(sshKey),
      dependsOn: findResourceDependencies(sshKey),
    };
  }
  return next;
}

// deno-lint-ignore require-await
export async function createSshKeyPlan(
  executors: Executors,
  state?: SSHKeyStates,
  config?: SSHKeyConfigs,
): Promise<Plan> {
  const plan: Plan = [];
  logger.debug({ state, config }, "[Plan][HCloud] Planning for hcloud ssh key changes");

  const previous = getPrevious(state);
  const next = getNext(config);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { name, config: nextConfig, dependsOn } = next[key];

    assertBranch(nextConfig);

    const createUnit: CreateUnit<SSHKeyConfig, SSHKeyState, CreateSshKey> = {
      type: Type.Create,
      executor: executors.createSshKey,
      args: [name, nextConfig],
      path: key,
      config: nextConfig,
      dependsOn,
    };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));
  for (const key of deleting) {
    const { state } = previous[key];

    const deleteUnit: DeleteUnit<SSHKeyState, DeleteSshKey> = {
      type: Type.Delete,
      executor: executors.deleteSshKey,
      args: [state],
      path: key,
      state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { name, config: nextConfig, dependsOn } = next[key];
    const { config: prevConfig, state } = previous[key];

    if (isConfigEqual(nextConfig, prevConfig)) {
      const noopUnit: NoopUnit<SSHKeyConfig, SSHKeyState> = {
        type: Type.Noop,
        path: key,
        config: prevConfig,
        state,
        dependsOn,
      };
      plan.push(noopUnit);
      continue;
    }

    if (nextConfig.publicKey !== prevConfig.publicKey) {
      throw new PlanError(
        `Cannot change publicKey for ssh key ${name} in place. Hetzner SSH keys are immutable; remove and recreate the resource.`,
        PlanErrorCode.UNSUPPORTED_OPERATION,
      );
    }

    assertBranch(nextConfig);

    const updateUnit: UpdateUnit<SSHKeyConfig, SSHKeyState, UpdateSshKey> = {
      type: Type.Update,
      executor: executors.updateSshKey,
      args: [name, nextConfig, state],
      path: key,
      state,
      config: nextConfig,
      dependsOn,
    };
    plan.push(updateUnit);
  }

  return plan;
}

// deno-lint-ignore require-await
export async function createSshKeyDestroyPlan(
  executors: Executors,
  state?: SSHKeyStates,
): Promise<Plan> {
  const plan: Plan = [];
  logger.debug({ state }, "[Plan][HCloud] Planning destroy for hcloud ssh keys");

  const previous = getPrevious(state);
  for (const key of Object.keys(previous)) {
    const { state } = previous[key];
    const deleteUnit: DeleteUnit<SSHKeyState, DeleteSshKey> = {
      type: Type.Delete,
      executor: executors.deleteSshKey,
      args: [state],
      path: key,
      state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  return plan;
}
