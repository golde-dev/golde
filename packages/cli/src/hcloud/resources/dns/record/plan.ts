import { isEqual } from "es-toolkit";
import { logger } from "../../../../logger.ts";
import { Type } from "../../../../types/plan.ts";
import { findResourceDependencies } from "../../../../dependencies.ts";
import { assertBranch } from "../../../../utils/resource.ts";
import { omitUndefined } from "../../../../utils/object.ts";
import { normalizeToSortedArray } from "../../../../utils/array.ts";
import { dnsPath } from "./path.ts";
import { zonePath } from "../../zone/path.ts";
import type {
  CreateUnit,
  DeleteUnit,
  NoopUnit,
  Plan,
  UpdateUnit,
} from "../../../../types/plan.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";
import type {
  DNSConfig,
  DNSState,
  RecordConfig,
  RecordState,
  RecordType,
} from "./types.ts";
import type { ZoneConfigs } from "../../zone/types.ts";
import type { CreateRecord, DeleteRecord, Executors, UpdateRecord } from "./executor.ts";

function normalizeConfigForComparison(config: RecordConfig): RecordConfig {
  return { ...config, value: normalizeToSortedArray(config.value) };
}

function getPrevious(state: DNSState = {}) {
  const records: {
    [path: string]: {
      config: RecordConfig;
      state: RecordState;
      zone: string;
      type: RecordType;
      name: string;
    };
  } = {};

  for (const [zone, zoneState] of Object.entries(state)) {
    for (const [type, recordsByName] of Object.entries(zoneState)) {
      for (const [name, record] of Object.entries(recordsByName)) {
        records[dnsPath(zone, type, name)] = {
          state: record,
          config: record.config,
          zone,
          type: type as RecordType,
          name,
        };
      }
    }
  }
  return records;
}

function getNext(config: DNSConfig = {}, managedZones: ZoneConfigs | undefined) {
  const records: {
    [path: string]: {
      config: RecordConfig;
      zone: string;
      zoneRef: string; // either literal zone name or a {{ resources.<zonePath>.name }} template
      type: RecordType;
      name: string;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [zone, zoneConfig] of Object.entries(config)) {
    const zoneIsManaged = !!(managedZones && zone in managedZones);
    const zoneResourcePath = zonePath(zone);
    const zoneAttrPath = `${zoneResourcePath}.name`;
    const zoneRef = zoneIsManaged
      ? `{{ resources.${zoneAttrPath} }}`
      : zone;
    const baseDeps: ResourceDependency[] = zoneIsManaged
      ? [
        {
          valuePath: zoneAttrPath,
          resourcePath: zoneResourcePath,
          resourceName: zone,
          resourceAttribute: "name",
        },
      ]
      : [];

    for (const [type, recordsByName] of Object.entries(zoneConfig)) {
      if (!recordsByName) continue;
      for (const [name, record] of Object.entries(recordsByName)) {
        records[dnsPath(zone, type, name)] = {
          config: omitUndefined(record),
          zone,
          zoneRef,
          type: type as RecordType,
          name,
          dependsOn: [...baseDeps, ...findResourceDependencies(record)],
        };
      }
    }
  }
  return records;
}

// deno-lint-ignore require-await
export async function createDNSPlan(
  executors: Executors,
  state?: DNSState,
  config?: DNSConfig,
  managedZones?: ZoneConfigs,
): Promise<Plan> {
  const plan: Plan = [];
  logger.debug({ state, config }, "[Plan][HCloud] Planning for hcloud dns changes");

  const previous = getPrevious(state);
  const next = getNext(config, managedZones);

  const creating = Object.keys(next).filter((key) => !(key in previous));
  for (const key of creating) {
    const { zoneRef, type, name, config: nextConfig, dependsOn } = next[key];
    assertBranch(nextConfig);

    const createUnit: CreateUnit<RecordConfig, RecordState, CreateRecord> = {
      type: Type.Create,
      executor: executors.createRecord,
      args: [zoneRef, type, name, nextConfig],
      path: key,
      config: nextConfig,
      dependsOn,
    };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));
  for (const key of deleting) {
    const { state, zone, type, name } = previous[key];
    const deleteUnit: DeleteUnit<RecordState, DeleteRecord> = {
      type: Type.Delete,
      executor: executors.deleteRecord,
      args: [zone, type, name, state],
      path: key,
      state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { zoneRef, type, name, config: nextConfig, dependsOn } = next[key];
    const { config: prevConfig, state } = previous[key];

    assertBranch(nextConfig);

    const normalizedPrev = normalizeConfigForComparison(prevConfig);
    const normalizedNext = normalizeConfigForComparison(nextConfig);

    if (!isEqual(normalizedPrev, normalizedNext)) {
      const updateUnit: UpdateUnit<RecordConfig, RecordState, UpdateRecord> = {
        type: Type.Update,
        executor: executors.updateRecord,
        args: [zoneRef, type, name, state, nextConfig],
        path: key,
        state,
        config: nextConfig,
        dependsOn,
      };
      plan.push(updateUnit);
    } else {
      const noopUnit: NoopUnit<RecordConfig, RecordState> = {
        type: Type.Noop,
        path: key,
        config: nextConfig,
        state,
        dependsOn: state.dependsOn,
      };
      plan.push(noopUnit);
    }
  }

  return plan;
}

// deno-lint-ignore require-await
export async function createDNSDestroyPlan(
  executors: Executors,
  state?: DNSState,
): Promise<Plan> {
  const plan: Plan = [];
  logger.debug({ state }, "[Plan][HCloud] Planning destroy for hcloud dns records");

  const previous = getPrevious(state);
  for (const key of Object.keys(previous)) {
    const { state, zone, type, name } = previous[key];
    const deleteUnit: DeleteUnit<RecordState, DeleteRecord> = {
      type: Type.Delete,
      executor: executors.deleteRecord,
      args: [zone, type, name, state],
      path: key,
      state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  return plan;
}
