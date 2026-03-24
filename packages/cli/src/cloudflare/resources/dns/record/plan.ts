import { logger } from "../../../../logger.ts";
import { isEqual } from "es-toolkit";
import { dnsPath } from "./path.ts";
import { mergeProjectTags } from "../../../../utils/tags.ts";
import { assertBranch } from "../../../../utils/resource.ts";
import { omitUndefined } from "../../../../utils/object.ts";
import { normalizeToSortedArray } from "../../../../utils/array.ts";
import { Type } from "../../../../types/plan.ts";
import { findResourceDependencies } from "../../../../dependencies.ts";
import type { Tags } from "../../../../types/config.ts";
import type { DNSConfig, DNSState, RecordConfig, RecordState, RecordType } from "./types.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan, UpdateUnit } from "../../../../types/plan.ts";
import type { CreateZoneRecord, DeleteZoneRecord, Executor, UpdateZoneRecord } from "./executor.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";

/**
 * Normalize the value field for comparison purposes.
 * Sorts arrays so ["a","b"] and ["b","a"] are treated as equal.
 */
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
    for (const [type, recordState] of Object.entries(zoneState)) {
      for (const [name, record] of Object.entries(recordState)) {
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

function getNext(config: DNSConfig = {}, tags: Tags = {}) {
  const records: {
    [path: string]: {
      config: RecordConfig;
      zone: string;
      type: RecordType;
      name: string;
      dependsOn: ResourceDependency[];
    };
  } = {};

  for (const [zone, zoneConfig] of Object.entries(config)) {
    for (const [type, recordConfig] of Object.entries(zoneConfig)) {
      for (const [name, record] of Object.entries(recordConfig)) {
        const withTags = mergeProjectTags(record, tags);
        const dependsOn = findResourceDependencies(record);

        records[dnsPath(zone, type, name)] = {
          config: omitUndefined(withTags),
          zone,
          type: type as RecordType,
          name,
          dependsOn,
        };
      }
    }
  }

  return records;
}

export const createDNSPlan = (
  executors: Executor,
  tags?: Tags,
  state?: DNSState,
  config?: DNSConfig,
): Promise<Plan> => {
  const plan: Plan = [];
  logger.debug(
    {
      state,
      config,
    },
    "[Plan][Cloudflare][DNS] Planning for cloudflare dns changes"
  );

  const previous = getPrevious(state);
  const next = getNext(config, tags);

  const create = Object.keys(next).filter((key) => !(key in previous));
  for (const key of create) {
    const { config, zone, type, name, dependsOn } = next[key];

    assertBranch(config);

    const createUnit: CreateUnit<RecordConfig, RecordState, CreateZoneRecord> = {
      type: Type.Create,
      executor: executors.createZoneRecord,
      args: [zone, type, name, config],
      path: key,
      config,
      dependsOn,
    };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));

  for (const key of deleting) {
    const { state, zone } = previous[key];
    const deleteUnit: DeleteUnit<RecordState, DeleteZoneRecord> = {
      type: Type.Delete,
      executor: executors.deleteZoneRecord,
      args: [zone, state],
      path: key,
      state: state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextConfig, zone, type, name, dependsOn } = next[key];
    const { config: prevConfig, state } = previous[key];

    assertBranch(nextConfig);

    const normalizedPrev = normalizeConfigForComparison(prevConfig);
    const normalizedNext = normalizeConfigForComparison(nextConfig);

    if (!isEqual(normalizedPrev, normalizedNext)) {
      const updateUnit: UpdateUnit<
        RecordConfig,
        RecordState,
        UpdateZoneRecord
      > = {
        type: Type.Update,
        executor: executors.updateZoneRecord,
        args: [zone, type, name, state, nextConfig],
        path: key,
        state,
        config: nextConfig,
        dependsOn,
      };
      plan.push(updateUnit);
    } else {
      const noopUnit: NoopUnit<
        RecordConfig,
        RecordState
      > = {
        type: Type.Noop,
        path: key,
        config: nextConfig,
        state,
        dependsOn: state.dependsOn,
      };
      plan.push(noopUnit);
    }
  }

  return Promise.resolve(plan);
};

export function createDNSDestroyPlan(
  executors: Executor,
  state?: DNSState,
) {
  const plan: Plan = [];
  logger.debug(
    {
      state,
    },
    "[Plan][Cloudflare][DNS] Planning for cloudflare dns changes",
  );

  const previous = getPrevious(state);
  for (const key of Object.keys(previous)) {
    const { state, zone } = previous[key];
    const deleteUnit: DeleteUnit<RecordState, DeleteZoneRecord> = {
      type: Type.Delete,
      executor: executors.deleteZoneRecord,
      args: [zone, state],
      path: key,
      state: state,
      dependsOn: state.dependsOn,
    };
    plan.push(deleteUnit);
  }

  return Promise.resolve(plan);
}
