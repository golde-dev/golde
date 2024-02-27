import { stringify } from "querystring";
import logger from "../logger";

interface CloudflareErrorCause {
  code: string;
  message: string;
  error_chain: unknown[]
}

interface CloudflareListResponse<D> {
  result?: D;
  success: boolean;
  errors?: CloudflareErrorCause[];
  resultInfo?: {
    total_count: number
  }
}

interface CloudflareResponse<D> {
  result?: D;
  success: boolean;
  errors?: CloudflareErrorCause[];
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
interface ZoneRecordRequest {
  content: string
  name: string;
  proxied?: boolean;
  type: string;
  comment?: string;
  tags?: string[]
  /**
   * Number of seconds
   */
  ttl?: number;
}
interface ZoneRecord {
  id: string;
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

class CloudflareError extends Error {
  public constructor(message: string, cause?: CloudflareErrorCause[] | Error) {
    super(message, { cause });
  }
}

export class CloudflareClient {
  private readonly apiKey: string;
  private readonly accountId: string;
  private readonly baseUrl = "https://api.cloudflare.com/client/v4";

  public constructor(apiKey: string, accountId: string) {
    this.apiKey = apiKey;
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
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async({ ok, json, status }) => {
      if (ok) {
        const {
          result,
          success,
          errors,
        } = await json() as CloudflareListResponse<T>;

        if (success && result) {
          return result;
        }
        else {
          throw new CloudflareError("Cloudflare request error", errors);
        }
      }
      throw new CloudflareError(`Cloudflare request error, status: ${status}`);
    }).finally(() => {
      const end = Date.now();
      logger.debug({ 
        path,
        query,
        time: end - start,
      }, "Completed cloudflare list request");
    });
  }

  private async makeRequest<T>(path: string, method = "GET", body?: BodyInit): Promise<T> {
    const start = Date.now();
    return fetch(`${this.baseUrl}/${path}`, {
      method,
      body,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async({ ok, json, status }) => {
      if (ok) {
        const {
          result,
          success,
          errors,
        } = await json() as CloudflareResponse<T>;

        if (success && result) {
          return result;
        }
        else {
          throw new CloudflareError("Cloudflare response error", errors);
        }
      }
      throw new CloudflareError(`Cloudflare request error, status: ${status}`);
    }).finally(() => {
      const end = Date.now();
      logger.debug({ 
        path,
        method,
        body,
        time: end - start,
      }, "Completed cloudflare request");
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
   * Get list of zones that account have access to
   * TODO: add memo
   */
  public async getZones(query?: object) {
    return this.makeListRequest<Zone[]>("/zones", query);
  }

  /**
   * Gen zone id by zone name
   */
  public async getZoneId(name: string): Promise<string> {
    const [zone] = await this.getZones({ name });
    if (zone) {
      return zone.id;
    }
    throw new CloudflareError(`Account do not have access to zone: ${name}`);
  }

  /**
   * Create bucket in r2
   */
  public async createBucket(config: BucketRequest): Promise<Bucket> {
    logger.debug(config, "Creating r2 bucket");
    return this.makeRequest<Bucket>(
      `/accounts/${this.accountId}/r2/buckets`,
      "POST",
      JSON.stringify(config)
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
   * Create dns record for zone
   */
  public async createZoneRecord(zoneName: string, config: ZoneRecordRequest): Promise<ZoneRecord> {
    const zoneId = await this.getZoneId(zoneName);

    return this.makeRequest<ZoneRecord>(
      `/zones/${zoneId}/dns_records`,
      "POST",
      JSON.stringify(config)
    );
  }
}