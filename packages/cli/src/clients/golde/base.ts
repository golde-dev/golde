import { logger } from "../../logger.ts";
import { GOLDE_API_URL } from "../../version.ts";

interface GoldeErrorCause {
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
    const start = Date.now();
    return fetch(`${this.baseUrl}${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      if (!r.ok) {
        throw new GoldeError("Golde request failed", {
          status: r.status,
          statusText: r.statusText,
        });
      }
      return await r.json() as T;
    }).finally(() => {
      const end = Date.now();
      logger.debug("Golde request", {
        path,
        method,
        body,
        time: end - start,
      });
    });
  }

  protected makeFileRequest(
    path: string,
    method: "POST",
    body: FormData,
  ): Promise<void> {
    const start = Date.now();
    return fetch(`${this.baseUrl}/${path}`, {
      method,
      body,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    }).then((r) => {
      if (!r.ok) {
        throw new GoldeError("Golde request failed", {
          status: r.status,
          statusText: r.statusText,
        });
      }
    }).finally(() => {
      const end = Date.now();
      logger.debug("Golde request", {
        path,
        method,
        time: end - start,
      });
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
