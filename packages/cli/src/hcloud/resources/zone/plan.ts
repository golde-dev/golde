import { logger } from "../../../logger.ts";
import { PlanError, PlanErrorCode } from "../../../error.ts";
import { Type } from "../../../types/plan.ts";
import { findResourceDependencies } from "../../../dependencies.ts";
import { isConfigEqual } from "../../../utils/config.ts";
import { assertBranch } from "../../../utils/resource.ts";
import { omitUndefined } from "../../../utils/object.ts";
import { zonePath } from "./path.ts";
import type {
  CreateUnit,
  DeleteUnit,
  NoopUnit,
  Plan,
  UpdateUnit,
} from "../../../types/plan.ts";
import type { ResourceDependency } from "../../../types/dependencies.ts";
import type { ZoneConfig, ZoneConfigs, ZoneState, ZoneStates } from "./types.ts";
import type { CreateZone, DeleteZone, Executors, UpdateZone } from "./executor.ts";

function getPrevious(state: ZoneStates = {}) {
  const previous: {
    [path: string]: {
      name: string;
      config: ZoneConfig;
      state: ZoneState;
    };
  } = {};

  for (const [name, zone] of Object.entries(state)) {
    previous[zonePath(name)] = {
      name,
      config: zone.config,
      state: zone,
    };
  }
  return previous;
}

function getNext(config: ZoneConfigs = {}) {
  const next: {
    [path: string]: {
      name: string;
      config: ZoneConfig;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [name, zone] of Object.entries(config)) {
    next[zonePath(name)] = {
      name,
      config: omitUndefined(zone),
      dependsOn: findResourceDependencies(zone),
    };
  }
  return next;
}

// deno-lint-ignore require-await
export async function createZonePlan(
  executors: Executors,
  state?: ZoneStates,
  config?: ZoneConfigs,
): Promise<Plan> {
  const plan: Plan = [];
  logger.debug({ state, config }, "[Plan][HCloud] Planning for hcloud zone changes");

  const previous = getPrevious(state);
  const next = getNext(config);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { name, config: nextConfig, dependsOn } = next[key];
    assertBranch(nextConfig);

    const createUnit: CreateUnit<ZoneConfig, ZoneState, CreateZone> = {
      type: Type.Create,
      executor: executors.createZone,
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
    const deleteUnit: DeleteUnit<ZoneState, DeleteZone> = {
      type: Type.Delete,
      executor: executors.deleteZone,
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
      const noopUnit: NoopUnit<ZoneConfig, ZoneState> = {
        type: Type.Noop,
        path: key,
        config: prevConfig,
        state,
        dependsOn,
      };
      plan.push(noopUnit);
      continue;
    }

    if (nextConfig.mode !== prevConfig.mode) {
      throw new PlanError(
        `Cannot change mode for zone ${name} in place. Hetzner zones are immutable on mode; remove and recreate.`,
        PlanErrorCode.UNSUPPORTED_OPERATION,
      );
    }

    assertBranch(nextConfig);

    const updateUnit: UpdateUnit<ZoneConfig, ZoneState, UpdateZone> = {
      type: Type.Update,
      executor: executors.updateZone,
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
export async function createZoneDestroyPlan(
  executors: Executors,
  state?: ZoneStates,
): Promise<Plan> {
  const plan: Plan = [];
  logger.debug({ state }, "[Plan][HCloud] Planning destroy for hcloud zones");

  const previous = getPrevious(state);
  for (const key of Object.keys(previous)) {
    const { state } = previous[key];
    const deleteUnit: DeleteUnit<ZoneState, DeleteZone> = {
      type: Type.Delete,
      executor: executors.deleteZone,
      args: [state],
      path: key,
      state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  return plan;
}
