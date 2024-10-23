import { logger } from "../../logger.ts";
import { isEqual } from "moderndash";
import { mergeTags, toTagsArray } from "../../utils/tags.ts";
import { assertBranch } from "../../utils/resource.ts";
import type { CloudflareClient } from "../../clients/cloudflare/client.ts";
import { Type } from "../../types/plan.ts";
import type { Tags } from "../../types/config.ts";
import type {
  CloudflareDNSRecord,
  CloudflareDNSRecordState,
  CloudflareDNSZones,
  CloudflareZonesState,
  RecordType,
} from "../types.ts";
import type { CreateUnit, DeleteUnit, NoopUnit, Plan, UpdateUnit } from "../../types/plan.ts";

async function createZoneRecord(
  this: CloudflareClient,
  zoneName: string,
  type: RecordType,
  name: string,
  config: CloudflareDNSRecord,
): Promise<CloudflareDNSRecordState> {
  assertBranch(config);

  const {
    id,
    ttl,
    proxied,
    zone_id: zoneId,
    modified_on: modifiedAt,
    created_on: createdAt,
    content: value,
  } = await this.createZoneRecord(zoneName, {
    type,
    name,
    tags: toTagsArray(config.tags),
    ttl: config.ttl,
    content: config.value,
    proxied: config.proxied,
    comment: config.comment,
  });

  return {
    id,
    ttl,
    proxied,
    zoneId,
    modifiedAt,
    createdAt,
    value,
    config,
  };
}
export type CreateZoneRecord = typeof createZoneRecord;

async function updateZoneRecord(
  this: CloudflareClient,
  zoneName: string,
  type: RecordType,
  name: string,
  recordId: string,
  config: CloudflareDNSRecord,
): Promise<CloudflareDNSRecordState> {
  assertBranch(config);
  const {
    id,
    ttl,
    proxied,
    zone_id: zoneId,
    modified_on: modifiedAt,
    created_on: createdAt,
    content: value,
  } = await this.updateZoneRecord(zoneName, recordId, {
    type,
    name,
    tags: toTagsArray(config.tags),
    ttl: config.ttl,
    content: config.value,
    proxied: config.proxied,
    comment: config.comment,
  });

  return {
    id,
    ttl,
    proxied,
    zoneId,
    modifiedAt,
    createdAt,
    value,
    config,
  };
}

export type UpdateZoneRecord = typeof updateZoneRecord;

async function deleteZoneRecord(
  this: CloudflareClient,
  zoneName: string,
  recordId: string,
): Promise<void> {
  await this.deleteZoneRecord(zoneName, recordId);
}

export type DeleteZoneRecord = typeof deleteZoneRecord;

export const createCloudflareExecutors = (client: CloudflareClient) => {
  return {
    createZoneRecord: createZoneRecord.bind(client),
    updateZoneRecord: updateZoneRecord.bind(client),
    deleteZoneRecord: deleteZoneRecord.bind(client),
  };
};

function getPrevious(state: CloudflareZonesState = {}) {
  const records: {
    [path: string]: {
      config: CloudflareDNSRecord;
      state: CloudflareDNSRecordState;
      zone: string;
      type: RecordType;
      name: string;
    };
  } = {};

  for (const [zone, zoneState] of Object.entries(state)) {
    for (const [type, recordState] of Object.entries(zoneState)) {
      for (const [name, record] of Object.entries(recordState)) {
        records[`dns.cloudflare.${zone}.${type}.${name}`] = {
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

function getNext(config: CloudflareDNSZones = {}, tags: Tags = {}) {
  const records: {
    [path: string]: {
      config: CloudflareDNSRecord;
      zone: string;
      type: RecordType;
      name: string;
    };
  } = {};

  for (const [zone, zoneConfig] of Object.entries(config)) {
    for (const [type, recordConfig] of Object.entries(zoneConfig)) {
      for (const [name, { tags: recordTags, ...record }] of Object.entries(recordConfig)) {
        records[`dns.cloudflare.${zone}.${type}.${name}`] = {
          config: { ...record, tags: mergeTags(tags, recordTags) },
          zone,
          type: type as RecordType,
          name,
        };
      }
    }
  }

  return records;
}

export const createCloudflareDNSPlan = (
  executors: ReturnType<typeof createCloudflareExecutors>,
  tags?: Tags,
  state?: CloudflareZonesState,
  config?: CloudflareDNSZones,
): Promise<Plan> => {
  const plan: Plan = [];
  logger.debug(
    "Planning for cloudflare dns changes",
    {
      state,
      config,
    },
  );

  const previous = getPrevious(state);
  const next = getNext(config, tags);

  const create = Object.keys(next).filter((key) => !(key in previous));
  for (const key of create) {
    const { config, zone, type, name } = next[key];

    const createUnit: CreateUnit<CloudflareDNSRecord, CloudflareDNSRecordState, CreateZoneRecord> =
      {
        type: Type.Create,
        executor: executors.createZoneRecord,
        args: [zone, type, name, config],
        path: key,
        config,
        dependsOn: [],
      };
    plan.push(createUnit);
  }

  const deleting = Object.keys(previous).filter((key) => !(key in next));
  for (const key of deleting) {
    const { state, zone, name } = previous[key];
    const deleteUnit: DeleteUnit<CloudflareDNSRecordState, DeleteZoneRecord> = {
      type: Type.Delete,
      executor: executors.deleteZoneRecord,
      args: [zone, name],
      path: key,
      state: state,
    };
    plan.push(deleteUnit);
  }

  const updating = Object.keys(next).filter((key) => key in previous);
  for (const key of updating) {
    const { config: nextConfig, zone, type, name } = next[key];
    const { config: prevConfig, state } = previous[key];

    if (!isEqual(prevConfig, nextConfig)) {
      const updateUnit: UpdateUnit<
        CloudflareDNSRecord,
        CloudflareDNSRecordState,
        UpdateZoneRecord
      > = {
        type: Type.Update,
        executor: executors.updateZoneRecord,
        args: [zone, type, name, state.id, nextConfig],
        path: key,
        state,
        config: nextConfig,
        dependsOn: [],
      };
      plan.push(updateUnit);
    } else {
      const noopUnit: NoopUnit<
        CloudflareDNSRecord,
        CloudflareDNSRecordState
      > = {
        type: Type.Noop,
        path: key,
        config: nextConfig,
        state,
      };
      plan.push(noopUnit);
    }
  }

  return Promise.resolve(plan);
};
