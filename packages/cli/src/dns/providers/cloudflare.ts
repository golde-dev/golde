import { logger } from "../../logger.ts";
import { assertBranch } from "../../utils/resource.ts";
import type { CloudflareClient } from "../../clients/cloudflare.ts";
import type { Plan } from "../../types/plan.ts";
import type { GitInfo } from "../../clients/git.ts";
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

export const createCloudflareDNSPlan = (
  _executors: ReturnType<typeof createCloudflareExecutors>,
  _git: GitInfo,
  state?: CloudflareZonesState,
  config?: CloudflareDNSZones,
): Promise<Plan> => {
  logger.debug(
    "Planning for cloudflare dns changes",
    {
      state,
      config,
    },
  );

  return Promise.resolve([]);
};
