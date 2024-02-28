
export interface BaseDNSRecord {
  branchPattern?: string;
  branch?: string;
  ttl?: number;
  value: string;
}

export interface CloudflareDNSRecord extends BaseDNSRecord{
  proxied?: boolean;
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

export interface DNSZoneState {
  
}

export interface DNSState {
  cloudflare?: {
    [zone: string]: DNSZoneState
  }
}