import { logger } from "../../logger.ts";
import { assertBranch } from "../../utils/resource.ts";
import type { CloudflareClient } from "../../clients/cloudflare.ts";
import { Type, type CreateUnit, type Plan } from "../../types/plan.ts";
import type { Tags } from "../../types/config.ts";
import type {
  CloudflareDNSRecord,
  CloudflareDNSRecordState,
  CloudflareDNSZones,
  CloudflareZonesState,
  RecordType,
} from "../types.ts";

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
    tags: config.tags,
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
    tags: config.tags,
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
      config: CloudflareDNSRecord,
      state: CloudflareDNSRecordState,
      zone: string,
      type: RecordType,
      name: string,
  }} = {}

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
      config: CloudflareDNSRecord,
      zone: string,
      type: RecordType,
      name: string,
  }} = {}

  for (const [zone, zoneConfig] of Object.entries(config)) {
    for (const [type, recordConfig] of Object.entries(zoneConfig)) {
      for (const [name, record] of Object.entries(recordConfig)) {
        records[`dns.cloudflare.${zone}.${type}.${name}`] = {
          config: record,
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
  _tags?: Tags,
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

  const toCreateCandidates = Object.keys(next).filter(key => !(key in previous));
  for (const key of toCreateCandidates) {
    const {config, zone, type, name} = next[key];

    const createUnit: CreateUnit<CloudflareDNSRecord, CloudflareDNSRecordState, CreateZoneRecord> = {
      type: Type.Create,
      executor: executors.createZoneRecord,
      args: [zone, type, name, config],
      path: key,
      config,
      dependsOn: [],
    };
    plan.push(createUnit);
  }

  return Promise.resolve(plan);
};
