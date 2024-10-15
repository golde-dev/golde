import type { Resource, WithBranch } from "../types/config.ts";

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

export interface BaseDNSRecord extends Resource {
  /**
   * Time to live in seconds
   */
  ttl?: number;
  /**
   * IP address or value
   */
  value: string;
}

export type ZoneRecords = Partial<
  Record<RecordType, Record<string, BaseDNSRecord>>
>;

export interface DNSZones {
  [zone: string]: ZoneRecords;
}

export interface DNSZonesState {
  [zone: string]: ZoneRecords;
}

export interface CloudflareDNSRecord extends BaseDNSRecord {
  proxied?: boolean;
  comment?: string;
  tags?: string[];
}

export type CloudflareZoneRecords = Partial<
  Record<RecordType, Record<string, CloudflareDNSRecord>>
>;

export interface CloudflareDNSZones {
  [zone: string]: CloudflareZoneRecords;
}

export interface DNSConfig {
  cloudflare?: CloudflareDNSZones;
  namecheap?: DNSZones;
}

export interface CloudflareDNSRecordState extends BaseDNSRecord {
  id: string;
  ttl: number;
  proxied: boolean;
  zoneId: string;
  modifiedAt: string;
  createdAt: string;
  config: WithBranch<CloudflareDNSRecord>;
}

export type CloudflareZoneRecordsState = Partial<
  Record<RecordType, Record<string, CloudflareDNSRecordState>>
>;
export interface CloudflareZonesState {
  [zone: string]: CloudflareZoneRecordsState;
}

export interface DNSState {
  cloudflare?: CloudflareZonesState;
  namecheap?: DNSZonesState;
}
