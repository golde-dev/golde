
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

export type CloudflareZoneRecords = Partial<Record<RecordType, Record<string, CloudflareDNSRecord>>>;

export interface DNSConfig {
  cloudflare?: {
    [zone: string]: CloudflareZoneRecords
  }
}

export type DNSZoneState = Partial<Record<RecordType, Record<string, CloudflareDNSRecord>>>;

export interface DNSState {
  cloudflare?: {
    [zone: string]: DNSZoneState
  }
}