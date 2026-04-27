import { logger } from "../../logger.ts";
import {
  type ApiResponse,
  CloudflareBase,
  CloudflareError,
  getErrorStatus,
  getFetchErrorCause,
} from "./base.ts";

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

const zonesCache: Record<string, Zone[]> = {};

export class DNSClient extends CloudflareBase {
  /**
   * Get list of zones that account have access to
   */
  public async getZones(query?: Record<string, string>): Promise<Zone[]> {
    const errorMessage = `Cloudflare failed to list zones`;
    const cacheKey = JSON.stringify(query);
    if (!zonesCache[cacheKey]) {
      try {
        const { result, success, errors } = await this.api
          .get("zones", { searchParams: { per_page: "20", ...query } })
          .json<ApiResponse<Zone[]>>();

        if (!success) {
          throw new CloudflareError(errorMessage, errors);
        }
        zonesCache[cacheKey] = result;
      } catch (error) {
        throw new CloudflareError(errorMessage, getFetchErrorCause(error));
      }
    }
    return zonesCache[cacheKey];
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
    const errorMessage =
      `Cloudflare failed to create a dns record with a name ${config.name} in zone ${zoneName}`;
    const zoneId = await this.getZoneId(zoneName);
    logger.debug({ zoneName, config }, "Creating dns record");
    try {
      const { result, success, errors } = await this.api
        .post(`zones/${zoneId}/dns_records`, { json: config })
        .json<ApiResponse<ZoneRecord>>();

      if (!success) {
        throw new CloudflareError(errorMessage, errors);
      }
      return result;
    } catch (error) {
      throw new CloudflareError(errorMessage, getFetchErrorCause(error));
    }
  }

  /**
   * Update dns record for zone
   */
  public async updateZoneRecord(
    zoneName: string,
    recordId: string,
    config: ZoneRecordRequest,
  ): Promise<ZoneRecord> {
    const errorMessage =
      `Cloudflare failed to update a dns record with a name ${config.name} in zone ${zoneName}`;
    const zoneId = await this.getZoneId(zoneName);
    logger.debug({ zoneId, recordId, config }, "Updating dns record");
    try {
      const { result, success, errors } = await this.api
        .patch(`zones/${zoneId}/dns_records/${recordId}`, { json: config })
        .json<ApiResponse<ZoneRecord>>();

      if (!success) {
        throw new CloudflareError(errorMessage, errors);
      }
      return result;
    } catch (error) {
      throw new CloudflareError(errorMessage, getFetchErrorCause(error));
    }
  }

  /**
   * Get a single dns record by id, or null if it does not exist
   */
  public async getZoneRecord(
    zoneName: string,
    recordId: string,
  ): Promise<ZoneRecord | null> {
    const zoneId = await this.getZoneId(zoneName);
    const errorMessage = `[Cloudflare] failed to get a dns record with id ${recordId} in zone ${zoneName}`;
    logger.debug({ zoneId, recordId }, "[Cloudflare] Getting dns record");
    try {
      const { result, success, errors } = await this.api
        .get(`zones/${zoneId}/dns_records/${recordId}`)
        .json<ApiResponse<ZoneRecord>>();

      if (!success) {
        throw new CloudflareError(errorMessage, errors);
      }
      return result;
    } catch (error) {
      throw new CloudflareError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async checkZoneRecordExists(
    zoneName: string,
    recordId: string,
  ): Promise<boolean> {
    try {
      await this.getZoneRecord(zoneName, recordId)
      return true;
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 404) {
        return false;
      } else {
        throw error;
      }
    }
  }

  /**
   * Delete dns record for zone
   */
  public async deleteZoneRecord(
    zoneName: string,
    recordId: string,
  ): Promise<void> {
    const errorMessage =
      `Cloudflare failed to delete a dns record with id ${recordId} in zone ${zoneName}`;
    const zoneId = await this.getZoneId(zoneName);
    logger.debug({ zoneId, recordId }, "Deleting dns record");
    try {
      const { success, errors } = await this.api
        .delete(`zones/${zoneId}/dns_records/${recordId}`)
        .json<ApiResponse<unknown>>();

      if (!success) {
        throw new CloudflareError(errorMessage, errors);
      }
    } catch (error) {
      throw new CloudflareError(errorMessage, getFetchErrorCause(error));
    }
  }
}
