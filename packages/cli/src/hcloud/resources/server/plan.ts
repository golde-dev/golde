import { logger } from "../../../logger.ts";
import { PlanError, PlanErrorCode } from "../../../error.ts";
import { Type } from "../../../types/plan.ts";
import { findResourceDependencies } from "../../../dependencies.ts";
import { isConfigEqual } from "../../../utils/config.ts";
import { assertBranch } from "../../../utils/resource.ts";
import { omitUndefined } from "../../../utils/object.ts";
import { serverPath } from "./path.ts";
import type {
  CreateUnit,
  DeleteUnit,
  NoopUnit,
  Plan,
  UpdateUnit,
} from "../../../types/plan.ts";
import type { ResourceDependency } from "../../../types/dependencies.ts";
import type { ServerConfig, ServerConfigs, ServerState, ServerStates } from "./types.ts";
import type { CreateServer, DeleteServer, Executors, UpdateServer } from "./executor.ts";

function getPrevious(state: ServerStates = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: ServerConfig;
      state: ServerState;
    };
  } = {};

  for (const [name, server] of Object.entries(state)) {
    previous[serverPath(name)] = {
      name,
      config: server.config,
      state: server,
    };
  }
  return previous;
}

function getNext(config: ServerConfigs = {}) {
  const next: {
    [path: string]: {
      name: string;
      config: ServerConfig;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [name, server] of Object.entries(config)) {
    next[serverPath(name)] = {
      name,
      config: omitUndefined(server),
      dependsOn: findResourceDependencies(server),
    };
  }
  return next;
}

// deno-lint-ignore require-await
export async function createServerPlan(
  executors: Executors,
  state?: ServerStates,
  config?: ServerConfigs,
): Promise<Plan> {
  const plan: Plan = [];
  logger.debug({ state, config }, "[Plan][HCloud] Planning for hcloud server changes");

  const previous = getPrevious(state);
  const next = getNext(config);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { name, config: nextConfig, dependsOn } = next[key];

    assertBranch(nextConfig);

    const createUnit: CreateUnit<ServerConfig, ServerState, CreateServer> = {
      type: Type.Create,
      executor: executors.createServer,
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

    const deleteUnit: DeleteUnit<ServerState, DeleteServer> = {
      type: Type.Delete,
      executor: executors.deleteServer,
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
      const noopUnit: NoopUnit<ServerConfig, ServerState> = {
        type: Type.Noop,
        path: key,
        config: prevConfig,
        state,
        dependsOn,
      };
      plan.push(noopUnit);
      continue;
    }

    // Immutable fields — Hetzner has no API to change these in place.
    if (nextConfig.image !== prevConfig.image) {
      throw new PlanError(
        `Cannot change image for server ${name} in place. Remove and recreate the server, or use rebuild manually.`,
        PlanErrorCode.UNSUPPORTED_OPERATION,
      );
    }
    if (nextConfig.location !== prevConfig.location) {
      throw new PlanError(
        `Cannot change location for server ${name} in place. Remove and recreate the server.`,
        PlanErrorCode.UNSUPPORTED_OPERATION,
      );
    }
    if (nextConfig.datacenter !== prevConfig.datacenter) {
      throw new PlanError(
        `Cannot change datacenter for server ${name} in place. Remove and recreate the server.`,
        PlanErrorCode.UNSUPPORTED_OPERATION,
      );
    }
    if (!isEqualOptional(nextConfig.sshKeys, prevConfig.sshKeys)) {
      throw new PlanError(
        `Cannot change sshKeys for server ${name} in place. SSH keys are applied at create time only.`,
        PlanErrorCode.UNSUPPORTED_OPERATION,
      );
    }
    if (nextConfig.userData !== prevConfig.userData) {
      throw new PlanError(
        `Cannot change userData for server ${name} in place. Remove and recreate the server.`,
        PlanErrorCode.UNSUPPORTED_OPERATION,
      );
    }
    if (
      nextConfig.enableIpv4 !== prevConfig.enableIpv4 ||
      nextConfig.enableIpv6 !== prevConfig.enableIpv6
    ) {
      throw new PlanError(
        `Cannot change enableIpv4/enableIpv6 for server ${name} in place. Remove and recreate the server.`,
        PlanErrorCode.UNSUPPORTED_OPERATION,
      );
    }

    assertBranch(nextConfig);

    const updateUnit: UpdateUnit<ServerConfig, ServerState, UpdateServer> = {
      type: Type.Update,
      executor: executors.updateServer,
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
export async function createServerDestroyPlan(
  executors: Executors,
  state?: ServerStates,
): Promise<Plan> {
  const plan: Plan = [];
  logger.debug({ state }, "[Plan][HCloud] Planning destroy for hcloud servers");

  const previous = getPrevious(state);
  for (const key of Object.keys(previous)) {
    const { state } = previous[key];
    const deleteUnit: DeleteUnit<ServerState, DeleteServer> = {
      type: Type.Delete,
      executor: executors.deleteServer,
      args: [state],
      path: key,
      state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  return plan;
}

function isEqualOptional<T>(a: T[] | undefined, b: T[] | undefined): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}
