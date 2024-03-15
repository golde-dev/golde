import { isEqual } from "moderndash";
import type { ZoneRecordRequest } from "../../clients/cloudflare";
import { PlanError, PlanErrorCode } from "../../error";
import logger from "../../logger";
import type { CloudflareProvider } from "../../providers/cloudflare";
import { Type, type ExecutionUnit, type Plan } from "../../types/plan";
import type { CloudflareDNSRecordState, CloudflareDNSZones, CloudflareZonesState, RecordType } from "../types";

const getRecords = (config?: CloudflareDNSZones, state?: CloudflareZonesState)  => {
  const flatRecords: Record<string, [zone: string, ZoneRecordRequest, CloudflareDNSRecordState | undefined]> = {};

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

export const createCloudflareDNSPlan = (
  cloudflare: CloudflareProvider, 
  prevConfig?: CloudflareDNSZones, 
  prevState?: CloudflareZonesState,
  nextConfig?: CloudflareDNSZones
): Plan => {
  logger.debug({
    prevConfig,
    nextConfig,
  }, "Planning for cloudflare dns changes");

  const prevRecords = getRecords(prevConfig, prevState);
  const nextRecords = getRecords(nextConfig, prevState);

  const added = Object
    .keys(nextRecords)
    .filter(key => !(key in prevRecords))
    .map(path => {
      const [zone, conf] = nextRecords[path];
      const executionUnit: ExecutionUnit<typeof cloudflare.createZoneRecord> = {
        type: Type.Create,
        executor: cloudflare.createZoneRecord,
        args: [zone, conf],
        path,
        dependencies: [],
      }; 
      return executionUnit;
    });

  
  const removed = Object
    .keys(prevRecords)
    .filter(key => !(key in nextRecords))
    .map(path => {
      const [zone,, state] = prevRecords[path];
      if (!state) {
        throw new PlanError(`Delete, state missing: ${path}`, PlanErrorCode.STATE_MISSING);
      }
      const executionUnit: ExecutionUnit<typeof cloudflare.deleteZoneRecord> = {
        type: Type.Delete,
        executor: cloudflare.deleteZoneRecord,
        args: [zone, state.id],
        path,
        dependencies: [],
      }; 
      return executionUnit;
    });

  
  const updated: ExecutionUnit<typeof cloudflare.updateZoneRecord>[] = [];
  Object
    .keys(nextRecords)
    .filter(key => key in prevRecords)
    .forEach(path => {
      const [zone, nextConf] = nextRecords[path];
      const [, prevConf, prevRecordState] = prevRecords[path];

      if (!prevRecordState) {
        throw new PlanError(`Update, state missing: ${path}`, PlanErrorCode.STATE_MISSING);
      }

      if (!isEqual(nextConf, prevConf)) {
        updated.push({
          type: Type.Create,
          executor: cloudflare.updateZoneRecord,
          args: [zone, prevRecordState.id, nextConf],
          path,
          dependencies: [],
        });
      }
    });

  return [
    ...removed, 
    ...updated,
    ...added, 
  ];
};