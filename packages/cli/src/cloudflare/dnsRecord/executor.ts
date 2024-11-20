import { logger } from "../../logger.ts";
import { formatDuration } from "../../utils/duration.ts";
import { toTagsArray } from "../../utils/tags.ts";
import type { WithBranch } from "../../types/config.ts";
import type { CloudflareClient } from "../client/client.ts";
import type { RecordConfig, RecordState, RecordType } from "./types.ts";
import type { ResourceDependency } from "../../types/dependencies.ts";

async function createZoneRecord(
  this: CloudflareClient,
  zoneName: string,
  type: RecordType,
  name: string,
  config: WithBranch<RecordConfig>,
  dependsOn: ResourceDependency[],
): Promise<RecordState> {
  const start = performance.now();
  const {
    id,
    zone_id: zoneId,
    modified_on: updatedAt,
    created_on: createdAt,
  } = await this.createZoneRecord(zoneName, {
    type,
    name,
    tags: toTagsArray(config.tags),
    ttl: config.ttl,
    content: config.value,
    proxied: config.proxied,
    comment: config.comment,
  });
  const end = performance.now();
  logger.debug(`[Cloudflare] Created dns record ${name} in ${formatDuration(end - start)}`);

  return {
    id,
    zoneId,
    updatedAt,
    createdAt,
    config,
    dependsOn,
  };
}
export type CreateZoneRecord = typeof createZoneRecord;

async function updateZoneRecord(
  this: CloudflareClient,
  zoneName: string,
  type: RecordType,
  name: string,
  recordId: string,
  config: WithBranch<RecordConfig>,
  dependsOn: ResourceDependency[],
): Promise<RecordState> {
  const start = performance.now();
  const {
    id,
    zone_id: zoneId,
    modified_on: updatedAt,
    created_on: createdAt,
  } = await this.updateZoneRecord(zoneName, recordId, {
    type,
    name,
    tags: toTagsArray(config.tags),
    ttl: config.ttl,
    content: config.value,
    proxied: config.proxied,
    comment: config.comment,
  });
  const end = performance.now();
  logger.debug(`[Cloudflare] Updated dns record ${name} in ${formatDuration(end - start)}`);
  return {
    id,
    zoneId,
    updatedAt,
    createdAt,
    config,
    dependsOn,
  };
}

export type UpdateZoneRecord = typeof updateZoneRecord;

async function deleteZoneRecord(
  this: CloudflareClient,
  zoneName: string,
  recordId: string,
): Promise<void> {
  const start = performance.now();
  await this.deleteZoneRecord(zoneName, recordId);
  const end = performance.now();
  logger.debug(`[Cloudflare] Deleted dns record in ${formatDuration(end - start)}`);
}

export type DeleteZoneRecord = typeof deleteZoneRecord;

export const createDNSExecutors = (client: CloudflareClient) => {
  return {
    createZoneRecord: createZoneRecord.bind(client),
    updateZoneRecord: updateZoneRecord.bind(client),
    deleteZoneRecord: deleteZoneRecord.bind(client),
  };
};

export type Executor = ReturnType<typeof createDNSExecutors>;
