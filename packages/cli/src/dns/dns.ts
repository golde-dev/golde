
export interface BaseDNSRecord {
  ttl: number;
  value: string;
}

export interface CloudflareDNSRecord extends BaseDNSRecord{
  proxied: boolean;
}

export interface DNSZoneRecords {
  A?: {
    [record: string]: CloudflareDNSRecord
  },
  AAAA?: {
    [record: string]: CloudflareDNSRecord
  }
}
export interface DNSConfig {
  cloudflare?: {
    [zone: string]: DNSZoneRecords
  }
}