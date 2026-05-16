import type { ResourceConfig, WithBranch } from "../../../../types/config.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";

export type RecordType =
  | "A"
  | "AAAA"
  | "CAA"
  | "CNAME"
  | "DS"
  | "HINFO"
  | "HTTPS"
  | "MX"
  | "NS"
  | "PTR"
  | "RP"
  | "SOA"
  | "SRV"
  | "SVCB"
  | "TLSA"
  | "TXT";

export interface RecordConfig extends ResourceConfig {
  /**
   * Single value or list of values. List values are stored as a Hetzner
   * RRSet — multiple records in one set, replaced atomically on update.
   */
  value: string | string[];
  /**
   * RRSet TTL (60–2147483647). Falls back to the zone's default TTL if unset.
   */
  ttl?: number;
  /**
   * Comment applied to every record in the RRSet.
   */
  comment?: string;
  labels?: Record<string, string>;
}

export type ZoneRecordsConfig = Partial<
  Record<RecordType, Record<string, RecordConfig>>
>;

export interface DNSConfig {
  [zone: string]: ZoneRecordsConfig;
}

export interface RecordValue {
  value: string;
  comment?: string;
}

export interface RecordState {
  zoneName: string;
  /**
   * Hetzner RRSet ID — composed as `<name>/<type>` (e.g. `www/A`).
   */
  rrsetId: string;
  name: string;
  type: RecordType;
  ttl: number | null;
  records: RecordValue[];
  labels: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  dependsOn: ResourceDependency[];
  config: WithBranch<RecordConfig>;
}

export type ZoneRecordsState = Partial<
  Record<RecordType, Record<string, RecordState>>
>;

export interface DNSState {
  [zone: string]: ZoneRecordsState;
}
