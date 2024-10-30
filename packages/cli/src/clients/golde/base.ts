import { logger } from "../../logger.ts";
import { GOLDE_API_URL } from "../../version.ts";

interface GoldeErrorCause {
  path: string;
  status: number;
  statusText: string;
}

export class GoldeError extends Error {
  public override cause?: GoldeErrorCause;

  public constructor(message: string, cause?: GoldeErrorCause) {
    super(message);
    this.cause = cause;
  }
}

export function notFoundAsUndefined<T>(
  promise: Promise<T>,
): Promise<T | undefined> {
  return promise.catch((error: unknown) => {
    if (error instanceof GoldeError) {
      if (error.cause?.status === 404) {
        return undefined;
      }
    }
    throw error;
  });
}

export class GoldeClientBase {
  protected readonly apiKey: string;
  protected readonly baseUrl = GOLDE_API_URL;

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  protected makeRequest<T>(
    path: string,
    method = "GET",
    body?: object,
  ): Promise<T> {
    return fetch(`${this.baseUrl}${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      if (!r.ok) {
        logger.debug("Golde client error", {
          method,
          body,
          url: r.url,
          status: r.status,
          statusText: r.statusText,
        });
        throw new GoldeError(`Golde request to: ${path} failed`, {
          path,
          status: r.status,
          statusText: r.statusText,
        });
      }
      if (r.status === 204) {
        return null as T;
      }
      return await r.json() as T;
    });
  }

  protected makeFileRequest(
    path: string,
    method: "POST",
    body: FormData,
  ): Promise<void> {
    return fetch(`${this.baseUrl}${path}`, {
      method,
      body,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    }).then((r) => {
      if (!r.ok) {
        logger.debug("Golde failed to fetch", {
          method,
          body,
          url: r.url,
          status: r.status,
          statusText: r.statusText,
        });
        throw new GoldeError(`Golde request to: ${path} failed`, {
          path,
          status: r.status,
          statusText: r.statusText,
        });
      }
    });
  }

  public async verifyUserToken(): Promise<void> {
    const { status } = await this.makeRequest<{ status: string }>(
      "/verify-token",
    );
    if (status !== "active") {
      throw new GoldeError(`Token status is not active: ${status}`);
    }
  }
}
