import ky, { HTTPError, type KyInstance } from "ky";
import { S3 } from "@/generic/client/s3.ts";
import { logger } from "../../logger.ts";
import type { CloudflareS3Credentials } from "@/cloudflare/types.ts";
import { get } from "es-toolkit/compat";

interface ErrorCause {
  code: string;
  message: string;
  error_chain: unknown[];
}

export interface ApiResponse<D> {
  result: D;
  success: boolean;
  errors?: ErrorCause[];
  resultInfo?: {
    total_count: number;
  };
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
  body?: unknown;
}

export function getFetchErrorCause(error: unknown): FetchErrorCause | undefined {
  if (error instanceof HTTPError) {
    const { response, request } = error;
    return {
      url: request.url,
      status: response.status,
      statusText: response.statusText,
      body: response.body,
    };
  }
  return;
}

export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof Error) {
    return get(error, "cause.status");
  }
}

export class CloudflareError extends Error {
  override cause?: ErrorCause[] | FetchErrorCause;
  public constructor(message: string, cause?: ErrorCause[] | FetchErrorCause) {
    super(message, { cause });
    this.cause = cause;
  }
}

export class CloudflareBase {
  protected readonly accountId: string;
  protected readonly api: KyInstance;
  protected s3?: S3;

  public constructor(apiToken: string, accountId: string, s3?: CloudflareS3Credentials) {
    this.accountId = accountId;

    this.api = ky.create({
      baseUrl: "https://api.cloudflare.com/client/v4/",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      hooks: {
        beforeRequest: [
          ({ request }) => {
            logger.debug(
              { url: request.url, method: request.method },
              "[Cloudflare] request",
            );
          },
        ],
      },
    });

    if (s3) {
      const {
        endpoint,
        accessKeyId,
        secretAccessKey,
      } = s3;

      this.s3 = new S3({
        region: "auto",
        endpoint,
        accessKeyId,
        secretAccessKey,
      }, {
        provider: "Cloudflare",
        serviceName: "R2",
      });
    }
  }

  public getS3Client() {
    return this.s3;
  }

  /**
   * Verify that user or account supplied token is active
   */
  public async verifyUserToken(): Promise<void> {
    const { accountId } = this;
    let result: VerifyTokenResult | undefined;

    try {
      ({ result } = await this.api.get("user/tokens/verify")
        .json<ApiResponse<VerifyTokenResult>>());
    } catch {
      try {
        ({ result } = await this.api.get(`accounts/${accountId}/tokens/verify`)
          .json<ApiResponse<VerifyTokenResult>>());
      } catch (error) {
        throw new CloudflareError(
          "Cloudflare failed to verify user token",
          getFetchErrorCause(error),
        );
      }
    }

    if (result.status !== "active") {
      throw new CloudflareError(`Token is not active: ${result.status}`);
    }
  }
}
