import { logger } from "../../../../logger.ts";
import { formatDuration } from "../../../../utils/duration.ts";
import { toTagsArray } from "../../../../utils/tags.ts";
import type { OmitExecutionContext, WithBranch } from "@/types/config.ts";
import type { CloudflareClient } from "../../../client/client.ts";
import { normalizeToArray } from "../../../../utils/array.ts";
import type { RecordConfig, RecordState, RecordType } from "./types.ts";

async function createZoneRecord(
  this: CloudflareClient,
  zoneName: string,
  type: RecordType,
  name: string,
  config: WithBranch<RecordConfig>,
): Promise<OmitExecutionContext<RecordState>> {
  const start = performance.now();
  const values = normalizeToArray(config.value);

  const results = await Promise.all(
    values.map((value) =>
      this.createZoneRecord(zoneName, {
        type,
        name,
        tags: toTagsArray(config.tags),
        ttl: config.ttl,
        content: value,
        proxied: config.proxied,
        comment: config.comment,
      })
    ),
  );

  const end = performance.now();
  logger.debug(
    `[Execute][Cloudflare] Created ${results.length} dns record(s) ${name} in ${formatDuration(end - start)}`,
  );

  const first = results[0];

  return {
    records: Object.fromEntries(
      results.map((r, i) => [values[i], r.id]),
    ),
    zoneId: first.zone_id,
    updatedAt: first.modified_on,
    createdAt: first.created_on,
    config,
  };
}
export type CreateZoneRecord = typeof createZoneRecord;

async function updateZoneRecord(
  this: CloudflareClient,
  zoneName: string,
  type: RecordType,
  name: string,
  prevState: RecordState,
  config: WithBranch<RecordConfig>,
): Promise<OmitExecutionContext<RecordState>> {
  const start = performance.now();
  const newValues = normalizeToArray(config.value);
  const oldValues = normalizeToArray(prevState.config.value);

  const oldRecordIds = { ...prevState.records };

  const toDelete = oldValues.filter((v) => !newValues.includes(v));
  const toCreate = newValues.filter((v) => !oldValues.includes(v));
  const toKeep = newValues.filter((v) => oldValues.includes(v));

  // Delete removed values
  await Promise.all(
    toDelete.map((v) => {
      const recordId = oldRecordIds[v];
      return this.deleteZoneRecord(zoneName, recordId);
    }),
  );

  // Create new values
  const created = await Promise.all(
    toCreate.map((value) =>
      this.createZoneRecord(zoneName, {
        type,
        name,
        tags: toTagsArray(config.tags),
        ttl: config.ttl,
        content: value,
        proxied: config.proxied,
        comment: config.comment,
      })
    ),
  );

  // Update kept values (config fields like ttl/proxied/comment may have changed)
  const updated = await Promise.all(
    toKeep.map((value) => {
      const recordId = oldRecordIds[value];
      return this.updateZoneRecord(zoneName, recordId, {
        type,
        name,
        tags: toTagsArray(config.tags),
        ttl: config.ttl,
        content: value,
        proxied: config.proxied,
        comment: config.comment,
      });
    }),
  );

  const end = performance.now();
  logger.debug(
    `[Execute][Cloudflare] Updated dns record ${name} (created: ${toCreate.length}, deleted: ${toDelete.length}, kept: ${toKeep.length}) in ${formatDuration(end - start)}`,
  );

  // Build new records map
  const newRecordIds: Record<string, string> = {};
  for (let i = 0; i < toCreate.length; i++) {
    newRecordIds[toCreate[i]] = created[i].id;
  }
  for (let i = 0; i < toKeep.length; i++) {
    newRecordIds[toKeep[i]] = updated[i].id;
  }

  const firstResult = updated[0] ?? created[0];

  return {
    records: newRecordIds,
    zoneId: firstResult.zone_id,
    updatedAt: firstResult.modified_on,
    createdAt: firstResult.created_on,
    config,
  };
}

export type UpdateZoneRecord = typeof updateZoneRecord;

async function deleteZoneRecord(
  this: CloudflareClient,
  zoneName: string,
  state: RecordState,
): Promise<void> {
  const start = performance.now();

  await Promise.all(
    Object.values(state.records).map((recordId) =>
      this.deleteZoneRecord(zoneName, recordId)
    ),
  );

  const end = performance.now();
  logger.debug(`[Execute][Cloudflare] Deleted dns record(s) in ${formatDuration(end - start)}`);
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
