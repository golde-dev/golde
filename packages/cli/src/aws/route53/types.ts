import type { Tags } from "../../types/config.ts";
import type { Resource, WithBranch } from "../../types/config.ts";

export type RecordType =
  | "A"
  | "AAAA"
  | "CAA"
  | "CNAME"
  | "DKIM"
  | "DMARC"
  | "DNSKEY"
  | "DS"
  | "MX"
  | "NS"
  | "PTR"
  | "SOA"
  | "SPF"
  | "SRV"
  | "SVCB"
  | "TXT";

export interface RecordConfig extends Resource {
  /**
   * Time to live in seconds
   */
  ttl?: number;
  /**
   * IP address or value
   */
  value: string;
  proxied?: boolean;
  comment?: string;
  tags?: Tags;
}

export type ZoneRecordsConfig = Partial<
  Record<RecordType, Record<string, RecordConfig>>
>;

export interface Route53Config {
  [zone: string]: ZoneRecordsConfig;
}

export interface RecordState {
  id: string;
  value: string;
  ttl: number;
  zoneId: string;
  modifiedAt: string;
  createdAt: string;
  config: WithBranch<RecordConfig>;
}

export type ZoneRecordsState = Partial<
  Record<RecordType, Record<string, RecordState>>
>;

export interface Route53State {
  [zone: string]: ZoneRecordsState;
}
