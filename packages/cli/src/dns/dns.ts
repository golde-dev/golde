
export type RecordType = 
  "A" | "AAAA" | "CAA" | "CNAME" | "DKIM" | "DMARC" | "DNSKEY" | "DS" | "MX" | "NS" | "PTR" | "SOA" | "SPF" | "SRV" | "SVCB" | "TXT"; 


export interface BaseDNSRecord {
  branchPattern?: string;
  branch?: string;
  ttl?: number;
  value: string;
}

export interface CloudflareDNSRecord extends BaseDNSRecord{
  proxied?: boolean;
  comment?: string;
  tags?: string;
}

export type DNSZoneRecords = Partial<Record<RecordType, Record<string, CloudflareDNSRecord>>>;

export interface DNSConfig {
  cloudflare?: {
    [zone: string]: DNSZoneRecords
  }
}

export type DNSZoneState = Partial<Record<RecordType, Record<string, CloudflareDNSRecord>>>;

export interface DNSState {
  cloudflare?: {
    [zone: string]: DNSZoneState
  }
}