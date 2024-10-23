import { CloudflareBase, CloudflareError } from "./base.ts";

/**
 * @see https://developers.cloudflare.com/api/operations/zones-get
 */
interface Zone {
  id: string;
  name: string;
}

/**
 * @see https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 */
interface ZoneRecordRequest {
  /**
   * IP address
   * @example: 198.51.100.4
   */
  content: string;
  /**
   * name of record, @ for root
   */
  name: string;
  type: string;
  proxied?: boolean;
  comment?: string;
  tags?: string[];
  /**
   * Number of seconds
   */
  ttl?: number;
}

interface ZoneRecord {
  id: string;
  content: string;
  name: string;
  proxied: boolean;
  type: "A";
  comment: string;
  created_on: string;
  locked: boolean;
  meta: {
    "auto_added": boolean;
    "source": string;
  };
  modified_on: string;
  proxiable: boolean;
  tags: string[];
  ttl: number;
  zone_id: string;
  zone_name: string;
}

export class DNSClient extends CloudflareBase {
  /**
   * Get list of zones that account have access to
   */
  // @decMemoize()
  public getZones(query?: object): Promise<Zone[]> {
    return this.makeListRequest<Zone[]>("/zones", query);
  }

  /**
   * Gen zone id by zone name
   */
  public async getZoneId(name: string): Promise<string> {
    const [zone] = await this.getZones({ name }) as (Zone | undefined)[];
    if (zone) {
      return zone.id;
    }
    throw new CloudflareError(`Account do not have access to zone: ${name}`);
  }

  /**
   * Create dns record for zone
   */
  public async createZoneRecord(
    zoneName: string,
    config: ZoneRecordRequest,
  ): Promise<ZoneRecord> {
    const zoneId = await this.getZoneId(zoneName);

    return this.makeRequest<ZoneRecord>(
      `/zones/${zoneId}/dns_records`,
      "POST",
      config,
    );
  }

  /**
   * Update dns record for zone
   */
  public async updateZoneRecord(
    zoneName: string,
    recordId: string,
    config: ZoneRecordRequest,
  ): Promise<ZoneRecord> {
    const zoneId = await this.getZoneId(zoneName);

    return this.makeRequest<ZoneRecord>(
      `/zones/${zoneId}/dns_records/${recordId}`,
      "PATCH",
      config,
    );
  }

  /**
   * Delete dns record for zone
   */
  public async deleteZoneRecord(
    zoneName: string,
    recordId: string,
  ): Promise<void> {
    const zoneId = await this.getZoneId(zoneName);

    return this.makeRequest(
      `/zones/${zoneId}/dns_records/${recordId}`,
      "DELETE",
    );
  }
}
