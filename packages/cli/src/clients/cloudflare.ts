import { stringify } from "querystring";
import logger from "../logger";
import { decMemoize } from "moderndash";


interface ErrorCause {
  code: string;
  message: string;
  error_chain: unknown[]
}

interface ListResponse<D> {
  result?: D;
  success: boolean;
  errors?: ErrorCause[];
  resultInfo?: {
    total_count: number
  }
}

interface Response<D> {
  result?: D;
  success: boolean;
  errors?: ErrorCause[];
}

/**
 * @see https://developers.cloudflare.com/api/operations/user-api-tokens-verify-token
 */
interface VerifyTokenResult {
  expires_on: string
  id: string
  not_before: string
  status: "active" | "disabled" | "expired"
}

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
export interface ZoneRecordRequest {
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
  tags?: string[]
  /**
   * Number of seconds
   */
  ttl?: number;
}

export interface ZoneRecord {
  id: string;
  content: string,
  name: string,
  proxied: boolean,
  type: "A",
  comment: string,
  created_on: string,
  locked: boolean,
  meta: {
    "auto_added": boolean;
    "source": string;
  },
  modified_on: string,
  proxiable: boolean,
  tags: string[],
  ttl: number,
  zone_id: string,
  zone_name: string
}

/**
 * @see https://developers.cloudflare.com/api/operations/r2-create-bucket
 */
interface BucketRequest {
  locationHint?: "apac" | "eeur" | "enam" | "weur" | "wnam"
  name: string;
}

interface Bucket {
  creation_date: string;
  location: "apac" | "eeur" | "enam" | "weur" | "wnam"
  name: string;
}

interface FetchErrorCause {
  status: number;
  statusText: string
}

class CloudflareError extends Error {
  public constructor(message: string, cause?: ErrorCause[] | FetchErrorCause) {
    super(message, { cause });
  }
}

export class CloudflareClient {
  private readonly apiToken: string;
  private readonly accountId: string;
  private readonly baseUrl = "https://api.cloudflare.com/client/v4";

  public constructor(apiToken: string, accountId: string) {
    this.apiToken = apiToken;
    this.accountId = accountId;
  }

  private async makeListRequest<T>(path: string, extraQuery?: object): Promise<T> {
    const start = Date.now();
    const query = stringify({
      per_page: 10000,
      ...extraQuery,
    });
    
    return fetch(`${this.baseUrl}/${path}?${query}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    }).then(async(r) => {
      if (!r.ok) {
        throw new CloudflareError("Cloudflare request error", {
          status: r.status,
          statusText: r.statusText,
        });
      }

      const {
        result,
        success,
        errors,
      } = await r.json() as ListResponse<T>;

      if (success && result) {
        return result;
      }
      else {
        throw new CloudflareError("Cloudflare request error", errors);
      }
    }).finally(() => {
      const end = Date.now();
      logger.debug("Completed cloudflare list request", 
        { 
          path,
          query,
          time: end - start,
        } 
      );
    });
  }

  private async makeRequest<T>(path: string, method = "GET", body?: object): Promise<T> {
    const start = Date.now();
    return fetch(`${this.baseUrl}/${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    }).then(async(r) => {
      if (!r.ok) {
        throw new CloudflareError("Cloudflare request error", {
          status: r.status,
          statusText: r.statusText,
        });
      }
      
      const {
        result,
        success,
        errors,
      } = await r.json() as Response<T>;
 
      if (success && result) {
        return result;
      }
      else {
        throw new CloudflareError("Cloudflare response error", errors);
      }
    }).finally(() => {
      const end = Date.now();
      logger.debug("Completed cloudflare request", 
        { 
          path,
          method,
          body,
          time: end - start,
        } 
      );
    });
  }

  /**
   * Verify that user supplied token is active
   */
  public async verifyUserToken(): Promise<void> {
    const { status } = await this.makeRequest<VerifyTokenResult>("/user/tokens/verify");

    if (status !== "active") {
      throw new CloudflareError(`Token is not active: ${status}`);
    }
  }

  /**
   * Create bucket in r2
   */
  public async createBucket(config: BucketRequest): Promise<Bucket> {
    logger.debug("Creating r2 bucket", config );
    return this.makeRequest<Bucket>(
      `/accounts/${this.accountId}/r2/buckets`,
      "POST",
      config
    );
  }

  /**
   * Delete bucket in R2
   */
  public async deleteBucket(name: string): Promise<void> {
    logger.debug(name, "Deleting r2 bucket");
    return this.makeRequest(
      `/accounts/${this.accountId}/r2/buckets/${name}`,
      "DELETE"
    );
  }

  /**
   * Get list of zones that account have access to
   */
  @decMemoize()
  public async getZones(query?: object): Promise<Zone[]> {
    return this.makeListRequest<Zone[]>("/zones", query);
  }
  
  /**
   * Gen zone id by zone name
   */
  public async getZoneId(name: string): Promise<string> {
    const [zone] = await this.getZones({ name });
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (zone) {
      return zone.id;
    }
    throw new CloudflareError(`Account do not have access to zone: ${name}`);
  }

  /**
   * Create dns record for zone
   */
  public async createZoneRecord(zoneName: string, config: ZoneRecordRequest): Promise<ZoneRecord> {
    const zoneId = await this.getZoneId(zoneName);

    return this.makeRequest<ZoneRecord>(
      `/zones/${zoneId}/dns_records`,
      "POST",
      config
    );
  }

  /**
   * Update dns record for zone
   */
  public async updateZoneRecord(zoneName: string, recordId: string,config: ZoneRecordRequest): Promise<ZoneRecord> {
    const zoneId = await this.getZoneId(zoneName);
  
    return this.makeRequest<ZoneRecord>(
      `/zones/${zoneId}/dns_records/${recordId}`,
      "PATCH",
      config
    );
  }

  /**
   * Delete dns record for zone
   */
  public async deleteZoneRecord(zoneName: string, recordId: string): Promise<void> {
    const zoneId = await this.getZoneId(zoneName);
    
    return this.makeRequest(
      `/zones/${zoneId}/dns_records/${recordId}`,
      "DELETE"
    );
  }
}