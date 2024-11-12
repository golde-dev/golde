import { logger } from "../../logger.ts";

interface ErrorCause {
  code: string;
  message: string;
  error_chain: unknown[];
}

interface ListResponse<D> {
  result?: D;
  success: boolean;
  errors?: ErrorCause[];
  resultInfo?: {
    total_count: number;
  };
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
  expires_on: string;
  id: string;
  not_before: string;
  status: "active" | "disabled" | "expired";
}

interface FetchErrorCause {
  url: string;
  status: number;
  statusText: string;
}

export class CloudflareError extends Error {
  public constructor(message: string, cause?: ErrorCause[] | FetchErrorCause) {
    super(message, { cause });
  }
}

export class CloudflareBase {
  protected readonly apiToken: string;
  protected readonly accountId: string;
  protected readonly baseUrl = "https://api.cloudflare.com/client/v4";

  public constructor(apiToken: string, accountId: string) {
    this.apiToken = apiToken;
    this.accountId = accountId;
  }

  protected makeListRequest<T>(
    path: string,
    extraQuery?: object,
  ): Promise<T> {
    const query = new URLSearchParams({
      per_page: "20",
      ...extraQuery,
    }).toString();

    logger.debug("[Cloudflare] list request", {
      path,
      query,
      method: "GET",
    });
    return fetch(`${this.baseUrl}${path}?${query}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      if (!r.ok) {
        throw new CloudflareError("Cloudflare request error", {
          url: r.url,
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
      } else {
        throw new CloudflareError("Cloudflare request error", errors);
      }
    }).catch((error) => {
      if (error instanceof CloudflareError) {
        throw error;
      }
      throw new CloudflareError("Cloudflare request error", error);
    });
  }

  protected makeRequest<T>(
    path: string,
    method = "GET",
    body?: object,
  ): Promise<T> {
    logger.debug("[Cloudflare] request", {
      path,
      body,
      method: "GET",
    });

    return fetch(`${this.baseUrl}${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      if (!r.ok) {
        throw new CloudflareError("Cloudflare request error", {
          url: r.url,
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
      } else {
        throw new CloudflareError("Cloudflare response error", errors);
      }
    }).catch((error) => {
      if (error instanceof CloudflareError) {
        throw error;
      }
      throw new CloudflareError("Cloudflare request error", error);
    });
  }

  /**
   * Verify that user supplied token is active
   */
  public async verifyUserToken(): Promise<void> {
    const { status } = await this.makeRequest<VerifyTokenResult>(
      "/user/tokens/verify",
    );

    if (status !== "active") {
      throw new CloudflareError(`Token is not active: ${status}`);
    }
  }
}
