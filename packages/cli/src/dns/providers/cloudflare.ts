import { logger } from "../../logger.ts";
import { isEqual } from "moderndash";
import { PlanError, PlanErrorCode } from "../../error.ts";
import { Type } from "../../types/plan.ts";
import type { CloudflareClient, ZoneRecordRequest } from "../../clients/cloudflare.ts";
import type { ExecutionUnit, Plan } from "../../types/plan.ts";
import type {
  CloudflareDNSRecord,
  CloudflareDNSRecordState,
  CloudflareDNSZones,
  CloudflareZonesState,
  RecordType,
} from "../types.ts";
import type { GitInfo } from "../../clients/git.ts";
import { assertBranch } from "../../utils/resource.ts";

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
  recordId: string,
  config: ZoneRecordRequest,
): Promise<CloudflareDNSRecordState> {
  const {
    id,
    ttl,
    proxied,
    zone_id,
    modified_on,
    created_on,
    content: value,
  } = await this.updateZoneRecord(zoneName, recordId, config);

  return {
    id,
    ttl,
    proxied,
    zone_id,
    modified_on,
    created_on,
    value,
    config,
  };
}

async function deleteZoneRecord(
  this: CloudflareClient,
  zoneName: string,
  recordId: string,
): Promise<void> {
  await this.deleteZoneRecord(zoneName, recordId);
}

const getRecords = (
  config?: CloudflareDNSZones,
  state?: CloudflareZonesState,
) => {
  const flatRecords: Record<
    string,
    [zone: string, ZoneRecordRequest, CloudflareDNSRecordState | undefined]
  > = {};

  if (config) {
    Object.entries(config).forEach(([zone, records]) => {
      Object.entries(records).forEach(([type, typeRecord]) => {
        Object.entries(typeRecord).forEach(([name, {
          value: content,
          proxied,
          comment,
          tags,
          ttl,
        }]) => {
          const recordConfig: ZoneRecordRequest = {
            content,
            type,
            name,
            proxied,
            comment,
            tags,
            ttl,
          };
          const recordState = state?.[zone]?.[type as RecordType]?.[name];

          flatRecords[`dns.cloudflare.${zone}.${type}.${name}`] = [
            zone,
            recordConfig,
            recordState,
          ];
        });
      });
    });
  }
  return flatRecords;
};

export const createCloudflareExecutors = (client: CloudflareClient) => {
  return {
    createZoneRecord: createZoneRecord.bind(client),
    updateZoneRecord: updateZoneRecord.bind(client),
    deleteZoneRecord: deleteZoneRecord.bind(client),
  };
};

export const createCloudflareDNSPlan = (
  executors: ReturnType<typeof createCloudflareExecutors>,
  git: GitInfo,
  state?: CloudflareZonesState,
  config: CloudflareDNSZones,
): Promise<Plan> => {
  logger.debug(
    "Planning for cloudflare dns changes",
    {
      prevConfig,
      nextConfig,
    },
  );

  const prevRecords = getRecords(prevConfig, prevState);
  const nextRecords = getRecords(nextConfig, prevState);

  const added = Object
    .keys(nextRecords)
    .filter((key) => !(key in prevRecords))
    .map((path) => {
      const [zone, conf] = nextRecords[path];
      const executionUnit: ExecutionUnit<typeof createZoneRecord> = {
        type: Type.Create,
        executor: executors.createZoneRecord,
        args: [zone, conf],
        path,
        dependencies: [],
      };
      return executionUnit;
    });

  const removed = Object
    .keys(prevRecords)
    .filter((key) => !(key in nextRecords))
    .map((path) => {
      const [zone, , state] = prevRecords[path];
      if (!state) {
        throw new PlanError(
          `Delete, state missing: ${path}`,
          PlanErrorCode.STATE_MISSING,
        );
      }
      const executionUnit: ExecutionUnit<typeof deleteZoneRecord> = {
        type: Type.Delete,
        executor: executors.deleteZoneRecord,
        args: [zone, state.id],
        path,
        dependencies: [],
      };
      return executionUnit;
    });

  const updated: ExecutionUnit<typeof updateZoneRecord>[] = [];
  Object
    .keys(nextRecords)
    .filter((key) => key in prevRecords)
    .forEach((path) => {
      const [zone, nextConf] = nextRecords[path];
      const [, prevConf, prevRecordState] = prevRecords[path];

      if (!prevRecordState) {
        throw new PlanError(
          `Update, state missing: ${path}`,
          PlanErrorCode.STATE_MISSING,
        );
      }

      if (!isEqual(nextConf, prevConf)) {
        updated.push({
          type: Type.Update,
          executor: executors.updateZoneRecord,
          args: [zone, prevRecordState.id, nextConf],
          path,
          dependencies: [],
        });
      }
    });

  return Promise.resolve([
    ...removed,
    ...updated,
    ...added,
  ]);
};
