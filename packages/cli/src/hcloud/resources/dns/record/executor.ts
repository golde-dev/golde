import { isEqual } from "es-toolkit";
import { logger } from "../../../../logger.ts";
import { formatDuration } from "../../../../utils/duration.ts";
import { nowStringDate } from "../../../../utils/date.ts";
import { normalizeToArray, normalizeToSortedArray } from "../../../../utils/array.ts";
import { getIgnoreAlreadyDeleted } from "../../../../asyncStorage.ts";
import type { OmitExecutionContext, WithBranch } from "../../../../types/config.ts";
import type { HCloudClient } from "../../../client/client.ts";
import type { RRSet, RRSetRecord } from "../../../client/dns.ts";
import type { RecordConfig, RecordState, RecordType } from "./types.ts";

function buildRecords(
  config: WithBranch<RecordConfig>,
): RRSetRecord[] {
  const values = normalizeToArray(config.value);
  return values.map((value) => ({
    value,
    comment: config.comment,
  }));
}

function toState(
  zoneName: string,
  rrset: RRSet,
  config: WithBranch<RecordConfig>,
  createdAt: string,
  updatedAt: string,
): OmitExecutionContext<RecordState> {
  return {
    zoneName,
    rrsetId: rrset.id,
    name: rrset.name,
    type: rrset.type,
    ttl: rrset.ttl,
    records: rrset.records.map((r) => ({ value: r.value, comment: r.comment })),
    labels: rrset.labels,
    createdAt,
    updatedAt,
    config,
  };
}

async function createRecord(
  this: HCloudClient,
  zoneName: string,
  type: RecordType,
  rrName: string,
  config: WithBranch<RecordConfig>,
): Promise<OmitExecutionContext<RecordState>> {
  const start = performance.now();

  const rrset = await this.createRrset(zoneName, {
    name: rrName,
    type,
    ttl: config.ttl,
    records: buildRecords(config),
    labels: config.labels,
  });

  const end = performance.now();
  logger.debug(
    `[Execute][HCloud] Created rrset ${rrName}/${type} in zone ${zoneName} in ${formatDuration(end - start)}`,
  );

  const createdAt = nowStringDate();
  return toState(zoneName, rrset, config, createdAt, createdAt);
}
export type CreateRecord = typeof createRecord;

async function updateRecord(
  this: HCloudClient,
  zoneName: string,
  type: RecordType,
  rrName: string,
  state: RecordState,
  config: WithBranch<RecordConfig>,
): Promise<OmitExecutionContext<RecordState>> {
  const start = performance.now();
  const prev = state.config;

  // value (records) — replaces all records atomically via /actions/set_records
  const prevValues = normalizeToSortedArray(prev.value);
  const nextValues = normalizeToSortedArray(config.value);
  const valueChanged = !isEqual(prevValues, nextValues);
  const commentChanged = prev.comment !== config.comment;
  if (valueChanged || commentChanged) {
    await this.setRrsetRecords(zoneName, rrName, type, buildRecords(config));
    logger.debug(`[Execute][HCloud] Set records for rrset ${rrName}/${type} in zone ${zoneName}`);
  }

  if (config.ttl !== prev.ttl) {
    await this.changeRrsetTtl(zoneName, rrName, type, config.ttl ?? null);
    logger.debug(`[Execute][HCloud] Changed TTL for rrset ${rrName}/${type} in zone ${zoneName}`);
  }

  if (!isEqual(config.labels ?? {}, prev.labels ?? {})) {
    await this.updateRrsetLabels(zoneName, rrName, type, { labels: config.labels ?? {} });
    logger.debug(`[Execute][HCloud] Updated labels for rrset ${rrName}/${type} in zone ${zoneName}`);
  }

  const refreshed = await this.getRrset(zoneName, rrName, type);
  const end = performance.now();
  logger.debug(
    `[Execute][HCloud] Updated rrset ${rrName}/${type} in zone ${zoneName} in ${formatDuration(end - start)}`,
  );

  return toState(zoneName, refreshed, config, state.createdAt, nowStringDate());
}
export type UpdateRecord = typeof updateRecord;

async function deleteRecord(
  this: HCloudClient,
  zoneName: string,
  type: RecordType,
  rrName: string,
  state: RecordState,
): Promise<void> {
  const start = performance.now();

  if (getIgnoreAlreadyDeleted()) {
    const exists = await this.checkRrsetExists(zoneName, rrName, type);
    if (!exists) {
      logger.warn(
        `[Execute][HCloud] rrset ${rrName}/${type} in zone ${zoneName} already deleted, skipping (--ignore-already-deleted)`,
      );
      return;
    }
  }

  await this.deleteRrset(zoneName, rrName, type);

  const end = performance.now();
  logger.debug(
    `[Execute][HCloud] Deleted rrset ${rrName}/${type} in zone ${zoneName} (id=${state.rrsetId}) in ${formatDuration(end - start)}`,
  );
}
export type DeleteRecord = typeof deleteRecord;

export const createDNSExecutors = (client: HCloudClient) => {
  return {
    createRecord: createRecord.bind(client),
    updateRecord: updateRecord.bind(client),
    deleteRecord: deleteRecord.bind(client),
  };
};

export type Executors = ReturnType<typeof createDNSExecutors>;
